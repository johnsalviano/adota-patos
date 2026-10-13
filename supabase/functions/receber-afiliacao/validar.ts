// ============================================================
// VALIDAÇÃO — conferência dos dados recebidos do formulário de afiliação
// ============================================================

// Versão do texto de autorização aceito pelo candidato.
export const TERMO_VERSAO = 'v1-2026-10';

// Campos obrigatórios: [chave recebida, mensagem amigável]
export const CAMPOS_OBRIGATORIOS: Array<[string, string]> = [
  ['afNome', 'o seu nome completo'],
  ['afNomeMae', 'o nome da sua mãe'],
  ['afDataNasc', 'a sua data de nascimento'],
  ['afSexo', 'o seu sexo'],
  ['afEstadoCivil', 'o seu estado civil'],
  ['afRG', 'o seu RG'],
  ['afOrgaoExpedidor', 'o órgão expedidor e UF'],
  ['afCPF', 'o seu CPF'],
  ['afEndereco', 'o seu endereço'],
  ['afBairro', 'o seu bairro'],
  ['afCep', 'o seu CEP'],
  ['afCidade', 'a sua cidade'],
  ['afUf', 'a sua UF'],
  ['afTelefone', 'o seu telefone'],
  ['afEmail', 'o seu e-mail'],
  ['afCaes', 'a quantidade de cães de rua que você alimenta'],
  ['afGatos', 'a quantidade de gatos de rua que você alimenta'],
  ['afDecl1', 'a primeira declaração'],
  ['afDecl2', 'a segunda declaração'],
  ['afDecl3', 'a terceira declaração'],
  ['afDecl4', 'a quarta declaração'],
  ['afDecl5', 'a quinta declaração'],
];

// Limites de tamanho: impede que textos gigantes sobrecarreguem o banco.
export const LIMITES_DE_TAMANHO: Array<[string, number]> = [
  ['afNome', 100],
  ['afNomeMae', 100],
  ['afRG', 20],
  ['afOrgaoExpedidor', 10],
  ['afCPF', 14],
  ['afEndereco', 150],
  ['afBairro', 80],
  ['afCep', 9],
  ['afCidade', 60],
  ['afUf', 2],
  ['afTelefone', 15],
  ['afEmail', 100],
];

export function validarDados(dados: Record<string, unknown>): string[] {
  const erros: string[] = [];

  for (const [campo, rotulo] of CAMPOS_OBRIGATORIOS) {
    const valor = dados[campo];
    if (typeof valor !== 'string' || valor.trim() === '') {
      erros.push(`Conte para nós ${rotulo}.`);
    }
  }

  // Validação específica para CPF (formato básico)
  const cpf = dados['afCPF'];
  if (typeof cpf === 'string' && cpf.trim() !== '') {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!/^\d{11}$/.test(cpfLimpo)) {
      erros.push('O CPF informado não parece válido.');
    }
  }

  // Validação para CEF (formato básico)
  const cep = dados['afCep'];
  if (typeof cep === 'string' && cep.trim() !== '') {
    if (!/^\d{5}-?\d{3}$/.test(cep.replace(/\s/g, ''))) {
      erros.push('O CEP informado não parece válido.');
    }
  }

  // Validação para e-mail
  const email = dados['afEmail'];
  if (
    typeof email === 'string' &&
    email.trim() !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    erros.push('O e-mail informado não parece válido.');
  }

  // Validação para telefone (apenas dígitos e parênteses, traços, espaços)
  const telefone = dados['afTelefone'];
  if (typeof telefone === 'string' && telefone.trim() !== '') {
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length < 8 || digitos.length > 11) {
      erros.push('O telefone informado não parece válido.');
    }
  }

  // Validação para UF (deve ser duas letras)
  const uf = dados['afUf'];
  if (typeof uf === 'string' && uf.trim() !== '') {
    if (!/^[A-Z]{2}$/.test(uf.toUpperCase())) {
      erros.push('A UF informada não parece válida.');
    }
  }

  // Validação para quantidade de cães e gatos (devem ser números inteiros não negativos)
  const caes = dados['afCaes'];
  if (typeof caes === 'string') {
    if (!/^\d+$/.test(caes)) {
      erros.push('A quantidade de cães deve ser um número inteiro não negativo.');
    }
  }
  const gatos = dados['afGatos'];
  if (typeof gatos === 'string') {
    if (!/^\d+$/.test(gatos)) {
      erros.push('A quantidade de gatos deve ser um número inteiro não negativo.');
    }
  }

  // Validação para data de nascimento (não pode ser no futuro)
  const dataNasc = dados['afDataNasc'];
  if (typeof dataNasc === 'string' && dataNasc.trim() !== '') {
    const data = new Date(dataNasc);
    if (isNaN(data.getTime()) || data > new Date()) {
      erros.push('A data de nascimento informada não parece válida.');
    }
  }

  for (const [campo, maximo] of LIMITES_DE_TAMANHO) {
    const valor = dados[campo];
    if (typeof valor === 'string' && valor.length > maximo) {
      erros.push('Uma das respostas ficou muito longa. Resuma um pouco para continuar.');
      break;
    }
  }

  return erros;
}
