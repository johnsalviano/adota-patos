// ============================================================
// VALIDAÇÃO — conferência dos dados recebidos do formulário de doação de alimentos
// ============================================================

// Versão do texto de autorização aceito pelo candidato.
export const TERMO_VERSAO = 'v1-2026-10';

// Campos obrigatórios: [chave recebida, mensagem amigável]
export const CAMPOS_OBRIGATORIOS: Array<[string, string]> = [
  ['doadorNome', 'o seu nome'],
  ['doadorTelefone', 'um telefone para contato'],
  ['doadorEmail', 'o seu e-mail'],
  ['doadorCidade', 'a cidade onde você mora'],
  ['alimentoTipo', 'o tipo de alimento que deseja doar'],
];

// Limites de tamanho: impede que textos gigantes sobrecarreguem o banco.
export const LIMITES_DE_TAMANHO: Array<[string, number]> = [
  ['doadorNome', 80],
  ['doadorTelefone', 15],
  ['doadorEmail', 100],
  ['doadorCidade', 40],
  ['alimentoDescricao', 200],
];

export function validarDados(dados: Record<string, unknown>): string[] {
  const erros: string[] = [];

  for (const [campo, rotulo] of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (typeof valor !== 'string' || valor.trim() === '') {
      erros.push(`Conte para nós ${rotulo}.`);
    }
  }

  // Se alimentoTipo for 'outro', alimentoDescricao também é obrigatória
  const alimentoTipo = dados['alimentoTipo'];
  if (alimentoTipo === 'outro') {
    const descricao = dados['alimentoDescricao'];
    if (typeof descricao !== 'string' || descricao.trim() === '') {
      erros.push('Por favor, descreva o alimento que deseja doar.');
    }
  }

  const email = dados['doadorEmail'];
  if (
    typeof email === 'string' &&
    email.trim() !== '' &&
    !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())
  ) {
    erros.push('O e-mail informado não parece válido.');
  }

  for (const [campo, maximo] of LIMITES_DE_TAMANHO) {
    const valor = dados[campo];
    if (typeof valor === 'string' && valor.length > maximo) {
      erros.push('Uma das respostas ficou muito longa. Resuma um pouco para continuar.');
      break;
    }
  }

  if (dados['consentimento'] !== true) {
    erros.push('Precisamos da sua autorização para usar seus dados nesta solicitação.');
  }

  return erros;
}