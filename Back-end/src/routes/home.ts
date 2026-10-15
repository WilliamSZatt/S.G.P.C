import { Router } from 'express';

export const homeRouter = Router();

homeRouter.get('/', (_request, response) => {
  response.json({
    name: 'ComércioOS',
    description: 'Gestão simples e inteligente para o seu comércio.',
    features: ['Gestão de vendas', 'Controle de estoque', 'Relatórios e indicadores']
  });
});
