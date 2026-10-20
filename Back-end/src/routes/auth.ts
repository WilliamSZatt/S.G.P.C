import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { createAccessToken, createOpaqueToken, hashOpaqueToken } from '../lib/token.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyPasswordReset } from '../services/password-reset.js';
import { isAdultBirthDate, isValidCpfOrCnpj } from '../lib/validation.js';

const router = Router();
const email = z.string().trim().email().transform((value) => value.toLowerCase());
const password = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.');

const registerSchema = z.object({
  cnpj: z.string().trim().min(11),
  legalName: z.string().trim().min(2),
  fantasyName: z.string().trim().min(2),
  ie: z.string().trim().optional(),
  segment: z.string().trim().min(2),
  cep: z.string().trim().min(8),
  address: z.string().trim().min(2),
  number: z.string().trim().min(1),
  city: z.string().trim().min(2),
  state: z.string().trim().length(2),
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  birthDate: z.string().refine(isAdultBirthDate, 'A idade deve estar entre 18 e 100 anos.'),
  email,
  password,
  confirmPassword: z.string().min(1),
  terms: z.literal(true),
  privacy: z.literal(true)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword']
}).refine((data) => isValidCpfOrCnpj(data.cnpj), {
  message: 'CPF ou CNPJ inválido.',
  path: ['cnpj']
});

const loginSchema = z.object({ email, password: z.string().min(1), remember: z.boolean().optional() });
const requestResetSchema = z.object({ email });
const resetSchema = z.object({ token: z.string().min(1), password, confirmPassword: z.string().min(1) })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword']
  });

const publicUser = (user: { id: string; name: string; email: string; role: string; storeId: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role.toLowerCase(),
  storeId: user.storeId
});

router.post('/register', async (request, response) => {
  const data = registerSchema.parse(request.body);
  const document = data.cnpj.replace(/\D/g, '');
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  const existingStore = await prisma.store.findUnique({ where: { document } });

  if (existing || existingStore) {
    response.status(409).json({ message: 'E-mail ou documento já cadastrado.' });
    return;
  }

  const user = await prisma.$transaction(async (transaction) => {
    const store = await transaction.store.create({
      data: {
        document,
        legalName: data.legalName,
        fantasyName: data.fantasyName,
        stateTaxId: data.ie || null,
        segment: data.segment,
        zipCode: data.cep,
        address: data.address,
        number: data.number,
        city: data.city,
        state: data.state.toUpperCase()
      }
    });

    return transaction.user.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        birthDate: new Date(`${data.birthDate}T00:00:00.000Z`),
        email: data.email,
        passwordHash: await hashPassword(data.password),
        storeId: store.id
      }
    });
  });

  response.status(201).json({ user: publicUser(user), message: 'Cadastro realizado com sucesso.' });
});

router.post('/login', async (request, response) => {
  const data = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const validPassword = user ? await comparePassword(data.password, user.passwordHash) : false;

  if (!user || !validPassword) {
    response.status(401).json({ message: 'E-mail ou senha inválidos.' });
    return;
  }
  if (!user.active) {
    response.status(403).json({ message: 'Sua conta está inativa.' });
    return;
  }

  const token = createAccessToken({ sub: user.id, role: user.role, storeId: user.storeId });
  response.json({
    token,
    user: publicUser(user),
    expiresIn: null,
    message: 'Token persistente até o encerramento da conta.'
  });
});

router.get('/me', requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
  if (!user || !user.active) {
    response.status(401).json({ message: 'Usuário não encontrado ou inativo.' });
    return;
  }
  response.json({ user: publicUser(user) });
});

router.get('/store', requireAuth, async (request, response) => {
  const store = await prisma.store.findUnique({
    where: { id: request.auth!.storeId },
    select: {
      id: true,
      document: true,
      legalName: true,
      fantasyName: true,
      stateTaxId: true,
      segment: true,
      zipCode: true,
      address: true,
      number: true,
      city: true,
      state: true,
      users: {
        where: { id: request.auth!.sub },
        select: { id: true, name: true, email: true, phone: true, birthDate: true, role: true }
      }
    }
  });

  if (!store || store.users.length === 0) {
    response.status(404).json({ message: 'Comércio não encontrado.' });
    return;
  }

  const { users, ...storeData } = store;
  response.json({ store: storeData, user: users[0] });
});

router.delete('/account', requireAuth, async (request, response) => {
  const data = z.object({ password: z.string().min(1) }).parse(request.body);
  const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });

  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    response.status(401).json({ message: 'Senha inválida.' });
    return;
  }

  await prisma.store.delete({ where: { id: user.storeId } });
  response.json({ message: 'Conta e todos os dados foram excluídos permanentemente.' });
});

router.post('/forgot-password', async (request, response) => {
  const { email: userEmail } = requestResetSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: userEmail } });

  if (user) {
    const token = createOpaqueToken();
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashOpaqueToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + config.PASSWORD_RESET_EXPIRES_IN_MINUTES * 60_000)
      }
    });
    await notifyPasswordReset(user.email, token);
  }

  response.json({ message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.' });
});

router.post('/reset-password', async (request, response) => {
  const data = resetSchema.parse(request.body);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashOpaqueToken(data.token) } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    response.status(400).json({ message: 'Token inválido ou expirado.' });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash: await hashPassword(data.password) } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } })
  ]);
  response.json({ message: 'Senha redefinida com sucesso.' });
});

export const authRouter = router;
