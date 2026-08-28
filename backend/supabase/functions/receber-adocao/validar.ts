// ============================================================
// VALIDAÇÃO — conferência dos dados recebidos do formulário
// ============================================================

// Versão do texto de autorização aceito pelo candidato.
export const TERMO_VERSAO = 'v1-2026-08'

// Campos obrigatórios: [chave recebida, mensagem amigável]
export const CAMPOS_OBRIGATORIOS: Array<[string, string]> = [
  ['nome', 'o seu nome'],
  ['telefone', 'um telefone para contato'],
  ['email', 'o seu e-mail'],
  ['cidade', 'a cidade onde você mora'],
  ['experiencia', 'se você já teve experiências com animais'],
  ['motivo', 'o motivo pelo qual quer adotar'],
]

// Limites de tamanho: impede que textos gigantes sobrecarreguem o banco.
export const LIMITES_DE_TAMANHO: Array<[string, number]> = [
  ['nome', 80],
  ['telefone', 15],
  ['email', 100],
  ['cidade', 40],
  ['experiencia', 60],
  ['motivo', 300],
]

export function validarDados(dados: Record<string, unknown>): string[] {
  const erros: string[] = []

  for (const [campo, rotulo] of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo]
    if (typeof valor !== 'string' || valor.trim() === '') {
      erros.push(`Conte para nós ${rotulo}.`)
    }
  }

  const email = dados['email']
  if (
    typeof email === 'string' &&
    email.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    erros.push('O e-mail informado não parece válido.')
  }

  for (const [campo, maximo] of LIMITES_DE_TAMANHO) {
    const valor = dados[campo]
    if (typeof valor === 'string' && valor.length > maximo) {
      erros.push('Uma das respostas ficou muito longa. Resuma um pouco para continuar.')
      break
    }
  }

  if (dados['consentimento'] !== true) {
    erros.push('Precisamos da sua autorização para usar seus dados nesta solicitação.')
  }

  const animalId = dados['animal_id']
  if (
    animalId !== undefined &&
    animalId !== null &&
    animalId !== '' &&
    typeof animalId === 'string' &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animalId)
  ) {
    erros.push('Animal selecionado não encontrado.')
  }

  return erros
}