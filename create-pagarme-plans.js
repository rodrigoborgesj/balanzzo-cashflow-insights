// Script para criar planos no Pagar.me via API
// Execute este script no terminal com: node create-pagarme-plans.js

const PAGARME_API_KEY = 'sk_test_YOUR_API_KEY_HERE'; // Substitua pela sua chave de teste
const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

async function createPlan(planData) {
  try {
    const response = await fetch(`${PAGARME_BASE_URL}/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGARME_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData)
    });

    const result = await response.json();
    console.log('Plano criado:', result);
    return result;
  } catch (error) {
    console.error('Erro ao criar plano:', error);
  }
}

async function createPlans() {
  // Plano Mensal
  const monthlyPlan = {
    id: 'monthly',
    name: 'Plano Mensal Balanzzo',
    amount: 19700, // R$ 197,00 em centavos
    currency: 'BRL',
    interval: 'month',
    interval_count: 1,
    billing_type: 'prepaid',
    payment_methods: ['credit_card', 'pix'],
    installments: [1],
    metadata: {
      description: 'Plano mensal do Balanzzo'
    }
  };

  // Plano Semestral
  const semiannualPlan = {
    id: 'semiannual',
    name: 'Plano Semestral Balanzzo',
    amount: 98500, // R$ 985,00 em centavos
    currency: 'BRL',
    interval: 'month',
    interval_count: 6,
    billing_type: 'prepaid',
    payment_methods: ['credit_card', 'pix'],
    installments: [1, 2, 3],
    metadata: {
      description: 'Plano semestral do Balanzzo'
    }
  };

  console.log('Criando plano mensal...');
  await createPlan(monthlyPlan);

  console.log('Criando plano semestral...');
  await createPlan(semiannualPlan);
}

// Executar a criação dos planos
createPlans();