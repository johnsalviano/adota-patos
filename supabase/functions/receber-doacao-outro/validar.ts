// ============================================================
// VALIDAÇÃO — conferência dos dados recebidos do formulário de outras doações
// ============================================================

// Versão do texto de autorização aceito pelo candidato.
export const TERMO_VERSAO = 'v1-2026-10';

// Campos obrigatórios: [chave recebida, mensagem amigável]
export const CAMPOS_OBRIGATORIOS: Array<[string, string]> = [
  ['doadorNomeOutro', 'o seu nome'],
  ['doadorTelefoneOutro', 'um telefone para contato'],
  ['doadorEmailOutro', 'o seu e-mail'],
  ['doadorCidadeOutro', 'a cidade onde você mora'],
  ['outroDescricao', 'o que você deseja doar'],
];

// Limites de tamanho: impede que textos gigantes sobrecarreguem o banco.
export const LIMITES_DE_TAMANHO: Array<[string, number]> = [
  ['doadorNomeOutro', 80],
  ['doadorTelefoneOutro', 15],
  ['doadorEmailOutro', 100],
  ['doadorCidadeOutro', 40],
  ['outroDescricao', 300],
];

export function validarDados(dados: Record<string, unknown>): string[] {
  const erros: string[] = [];

  for (const [campo, rotulo] of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (typeof valor !== 'string' || valor.trim() === '') {
      erros.push(`Conte para nós ${rotulo}.`);
    }
  }

  const email = dados['doadorEmailOutro'];
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