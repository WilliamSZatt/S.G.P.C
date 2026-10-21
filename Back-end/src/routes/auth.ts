import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { createAccessToken, createOpaqueToken, hashOpaqueToken } from '../lib/token.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { notifyPasswordReset } from '../services/password-reset.js';
import { digitsOnly, isAdultBirthDate, isValidCpf, isValidCpfOrCnpj } from '../lib/validation.js';

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
const resetSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/, 'O código deve ter 6 dígitos.'),
  password,
  confirmPassword: z.string().min(1)
})
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword']
  });
  const teamUserSchema = z.object({
    name: z.string().trim().min(2),
    cpf: z.string().trim().refine(isValidCpf, 'CPF inválido.'),
    phone: z.string().trim().regex(/^\d{10,11}$/, 'Telefone inválido.'),
    birthDate: z.string().refine(isAdultBirthDate, 'A idade deve estar entre 18 e 100 anos.'),
    email,
    password,
    role: z.enum(['admin', 'operator']),
    status: z.enum(['active', 'inactive']).default('active')
  });
const teamUpdateSchema = teamUserSchema.extend({
    cpf: z.string().trim().refine(isValidCpf, 'CPF inválido.').optional(),
    phone: z.string().trim().regex(/^\d{10,11}$/, 'Telefone inválido.').optional(),
    birthDate: z.string().refine(isAdultBirthDate, 'A idade deve estar entre 18 e 100 anos.').optional(),
    password: password.optional()
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

router.get('/team', requireAuth, requireAdmin, async (request, response) => {
  const users = await prisma.user.findMany({
    where: { storeId: request.auth!.storeId },
    select: { id: true, name: true, cpf: true, email: true, phone: true, birthDate: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
  response.json({ items: users.map((user) => ({ ...user, role: user.role.toLowerCase(), status: user.active ? 'active' : 'inactive' })) });
});

router.post('/team', requireAuth, requireAdmin, async (request, response) => {
  const data = teamUserSchema.parse(request.body);
  const cpf = digitsOnly(data.cpf);
  const phone = digitsOnly(data.phone);
  const [cpfUser, cpfClient, phoneUser, phoneClient] = await Promise.all([
    prisma.user.findFirst({ where: { storeId: request.auth!.storeId, cpf } }),
    prisma.client.findFirst({ where: { storeId: request.auth!.storeId, cpf } }),
    prisma.user.findFirst({ where: { storeId: request.auth!.storeId, phone } }),
    prisma.client.findFirst({ where: { storeId: request.auth!.storeId, phone } })
  ]);
  if (cpfUser || cpfClient || phoneUser || phoneClient) {
    const errors = [];
    if (cpfUser || cpfClient) errors.push({ field: 'cpf', message: 'Este CPF já está cadastrado neste comércio.' });
    if (phoneUser || phoneClient) errors.push({ field: 'phone', message: 'Este telefone já está cadastrado neste comércio.' });
    response.status(409).json({ message: 'Existem dados já cadastrados.', errors });
    return;
  }
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        cpf,
        phone,
        birthDate: new Date(`${data.birthDate}T00:00:00.000Z`),
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: data.role === 'admin' ? 'ADMIN' : 'OPERATOR',
        active: data.status === 'active',
        storeId: request.auth!.storeId
      },
      select: { id: true, name: true, cpf: true, email: true, phone: true, birthDate: true, role: true, active: true, createdAt: true }
    });
    response.status(201).json({ user: { ...user, role: user.role.toLowerCase(), status: user.active ? 'active' : 'inactive' } });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      response.status(409).json({ message: 'E-mail ou CPF já cadastrado neste comércio.' });
      return;
    }
    throw error;
  }
});

router.patch('/team/:id/status', requireAuth, requireAdmin, async (request, response) => {
  const data = z.object({ status: z.enum(['active', 'inactive']) }).parse(request.body);
  const target = await prisma.user.findFirst({ where: { id: String(request.params.id), storeId: request.auth!.storeId } });
  if (!target) {
    response.status(404).json({ message: 'Usuário não encontrado.' });
    return;
  }
  if (target.id === request.auth!.sub && data.status === 'inactive') {
    response.status(400).json({ message: 'Você não pode desativar a própria conta.' });
    return;
  }
  if (target.id === request.auth!.sub && data.status === 'inactive') {
    response.status(400).json({ message: 'Você não pode desativar a própria conta.' });
    return;
  }
  const user = await prisma.user.update({ where: { id: target.id }, data: { active: data.status === 'active' }, select: { id: true, active: true } });
  response.json({ id: user.id, status: user.active ? 'active' : 'inactive' });
});

router.patch('/team/:id', requireAuth, requireAdmin, async (request, response) => {
  const data = teamUpdateSchema.parse(request.body);
  const id = String(request.params.id);
  const target = await prisma.user.findFirst({ where: { id, storeId: request.auth!.storeId } });
  if (!target) {
    response.status(404).json({ message: 'Usuário não encontrado.' });
    return;
  }

  const cpf = data.cpf ? digitsOnly(data.cpf) : undefined;
  const phone = data.phone ? digitsOnly(data.phone) : undefined;
  const [cpfUser, cpfClient, phoneUser, phoneClient, emailUser] = await Promise.all([
    cpf ? prisma.user.findFirst({ where: { storeId: target.storeId, cpf, NOT: { id } } }) : null,
    cpf ? prisma.client.findFirst({ where: { storeId: target.storeId, cpf } }) : null,
    phone ? prisma.user.findFirst({ where: { storeId: target.storeId, phone, NOT: { id } } }) : null,
    phone ? prisma.client.findFirst({ where: { storeId: target.storeId, phone } }) : null,
    prisma.user.findFirst({ where: { email: data.email, NOT: { id } } })
  ]);
  const errors = [];
  if (cpfUser || cpfClient) errors.push({ field: 'cpf', message: 'Este CPF já está cadastrado neste comércio.' });
  if (phoneUser || phoneClient) errors.push({ field: 'phone', message: 'Este telefone já está cadastrado neste comércio.' });
  if (emailUser) errors.push({ field: 'email', message: 'Este e-mail já está cadastrado.' });
  if (errors.length) {
    response.status(409).json({ message: 'Existem dados já cadastrados.', errors });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      ...(cpf ? { cpf } : {}),
      ...(phone ? { phone } : {}),
      ...(data.birthDate ? { birthDate: new Date(`${data.birthDate}T00:00:00.000Z`) } : {}),
      email: data.email,
      role: data.role === 'admin' ? 'ADMIN' : 'OPERATOR',
      active: data.status === 'active',
      ...(data.password ? { passwordHash: await hashPassword(data.password) } : {})
    },
    select: { id: true, name: true, cpf: true, email: true, phone: true, birthDate: true, role: true, active: true, createdAt: true }
  });
  response.json({ user: { ...user, role: user.role.toLowerCase(), status: user.active ? 'active' : 'inactive' } });
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

  if (!user || !user.active) {
    response.status(404).json({ message: 'Nenhuma conta ativa foi encontrada com este e-mail.' });
    return;
  }

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

  response.json({ message: 'Token de recuperação enviado com sucesso.' });
});

router.post('/reset-password', async (request, response) => {
  const data = resetSchema.parse(request.body);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashOpaqueToken(data.token.trim()) }
  });

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
