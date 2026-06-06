/** Starter templates — serialised Craft.js JSON for each pre-built document type */

export interface StarterTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  craftJson: Record<string, unknown>;
}

// ── helpers ────────────────────────────────────────────────────────────────

type NodeEntry = {
  type: { resolvedName: string };
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName: string;
  custom: Record<string, unknown>;
  parent?: string;
  hidden: boolean;
  nodes: string[];
  linkedNodes: Record<string, string>;
};

type CraftState = Record<string, NodeEntry>;

let _counter = 0;
const id = () => `n${++_counter}`;

const rootNode = (children: string[]): NodeEntry => ({
  type: { resolvedName: 'Document' },
  isCanvas: true,
  props: {},
  displayName: 'Documento',
  custom: {},
  parent: undefined,
  hidden: false,
  nodes: children,
  linkedNodes: {},
});

const heading = (content: string, level: 'h1' | 'h2' | 'h3' = 'h1', textAlign: 'left' | 'center' | 'right' = 'center', parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'HeadingBlock' }, isCanvas: false, props: { content, level, textAlign, color: '#111111', bold: true }, displayName: 'Título', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

const text = (content: string, textAlign: 'left' | 'center' | 'right' | 'justify' = 'justify', parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'TextBlock' }, isCanvas: false, props: { content, fontSize: 12, fontFamily: 'inherit', color: '#111111', textAlign, bold: false, italic: false, lineHeight: 1.6 }, displayName: 'Texto', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

const clause = (number: string, title: string, content: string, parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'ClauseBlock' }, isCanvas: false, props: { number, title, content, showNumber: true }, displayName: 'Cláusula', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

const divider = (parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'DividerBlock' }, isCanvas: false, props: { style: 'solid', color: '#d1d5db', marginTop: 12, marginBottom: 12, thickness: 1 }, displayName: 'Divisor', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

const spacer = (height = 24, parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'SpacerBlock' }, isCanvas: false, props: { height }, displayName: 'Espaço', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

const signature = (party: string, role = '', parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'SignatureBlock' }, isCanvas: false, props: { party, role, showDate: true, showLine: true, align: 'center', marginTop: 40 }, displayName: 'Assinatura', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

const columns2 = (col1: string, col2: string, parent = 'ROOT'): [string, NodeEntry] => {
  const nodeId = id();
  return [nodeId, { type: { resolvedName: 'ColumnsBlock' }, isCanvas: false, props: { columns: 2, col1, col2, col3: '', gap: 24, fontSize: 11 }, displayName: 'Colunas', custom: {}, parent, hidden: false, nodes: [], linkedNodes: {} }];
};

function buildState(entries: [string, NodeEntry][]): CraftState {
  const ids = entries.map(([k]) => k);
  const state: CraftState = { ROOT: rootNode(ids) };
  entries.forEach(([k, v]) => { v.parent = 'ROOT'; state[k] = v; });
  return state;
}

// ── Templates ─────────────────────────────────────────────────────────────

const contratoServicos = (): CraftState => buildState([
  heading('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', 'h1', 'center'),
  spacer(8),
  text('<p>Pelo presente instrumento particular, de um lado <strong>{{nome_contratante}}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{{cpf_cnpj_contratante}}</strong>, doravante denominado(a) <strong>CONTRATANTE</strong>; e de outro lado <strong>{{nome_prestador}}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{{cpf_cnpj_prestador}}</strong>, doravante denominado(a) <strong>PRESTADOR</strong>; têm entre si justo e contratado o seguinte:</p>', 'justify'),
  spacer(8),
  clause('1', 'DO OBJETO', '<p>O presente contrato tem por objeto a prestação dos seguintes serviços: <strong>{{descricao_servico}}</strong>.</p>'),
  clause('2', 'DO PRAZO', '<p>Os serviços terão início em {{data_inicio}} e término previsto em {{data_termino}}, podendo ser prorrogado mediante acordo entre as partes.</p>'),
  clause('3', 'DO VALOR E FORMA DE PAGAMENTO', '<p>Pela prestação dos serviços, o CONTRATANTE pagará ao PRESTADOR o valor total de R$ <strong>{{valor_total}}</strong>, a ser pago da seguinte forma: {{forma_pagamento}}.</p>'),
  clause('4', 'DAS OBRIGAÇÕES DO PRESTADOR', '<p>O PRESTADOR se compromete a executar os serviços com zelo, competência e dentro dos prazos acordados, respondendo pelos danos causados ao CONTRATANTE em decorrência de negligência ou imperícia.</p>'),
  clause('5', 'DAS OBRIGAÇÕES DO CONTRATANTE', '<p>O CONTRATANTE se compromete a fornecer ao PRESTADOR todas as informações e meios necessários para a execução dos serviços, bem como efetuar os pagamentos nas datas acordadas.</p>'),
  clause('6', 'DA RESCISÃO', '<p>O presente contrato poderá ser rescindido por qualquer das partes mediante notificação prévia de 30 (trinta) dias, por escrito.</p>'),
  clause('7', 'DO FORO', '<p>Fica eleito o foro da comarca de {{cidade}}, Estado de {{estado}}, para dirimir quaisquer controvérsias oriundas do presente contrato.</p>'),
  spacer(16),
  text('<p style="text-align:center">{{cidade}}, {{data_assinatura}}</p>', 'center'),
  signature('CONTRATANTE', '{{nome_contratante}}'),
  signature('PRESTADOR', '{{nome_prestador}}'),
]);

const nda = (): CraftState => buildState([
  heading('ACORDO DE CONFIDENCIALIDADE (NDA)', 'h1', 'center'),
  spacer(8),
  text('<p>Este Acordo de Confidencialidade e Não Divulgação é celebrado entre <strong>{{parte_divulgadora}}</strong> ("Parte Divulgadora") e <strong>{{parte_receptora}}</strong> ("Parte Receptora"), em {{data_acordo}}.</p>', 'justify'),
  spacer(8),
  clause('1', 'DAS INFORMAÇÕES CONFIDENCIAIS', '<p>Consideram-se confidenciais todas as informações técnicas, comerciais, financeiras e estratégicas divulgadas pela Parte Divulgadora, incluindo, sem limitação: {{tipo_informacoes}}.</p>'),
  clause('2', 'DAS OBRIGAÇÕES', '<p>A Parte Receptora se compromete a: (i) manter estrita confidencialidade das informações; (ii) não divulgar a terceiros sem autorização prévia e por escrito; (iii) utilizar as informações exclusivamente para os fins acordados.</p>'),
  clause('3', 'DO PRAZO', '<p>Este acordo vigorará por {{prazo_vigencia}} anos a partir da data de assinatura, permanecendo as obrigações de sigilo válidas mesmo após o término.</p>'),
  clause('4', 'DAS PENALIDADES', '<p>O descumprimento das obrigações previstas neste acordo sujeitará a Parte infratora ao pagamento de indenização por perdas e danos, sem prejuízo das demais sanções legais cabíveis.</p>'),
  clause('5', 'DO FORO', '<p>Fica eleito o foro da comarca de {{cidade}} para dirimir quaisquer litígios decorrentes deste acordo.</p>'),
  spacer(16),
  text('<p style="text-align:center">{{cidade}}, {{data_acordo}}</p>', 'center'),
  signature('PARTE DIVULGADORA', '{{parte_divulgadora}}'),
  signature('PARTE RECEPTORA', '{{parte_receptora}}'),
]);

const proposta = (): CraftState => buildState([
  heading('PROPOSTA COMERCIAL', 'h1', 'center'),
  spacer(8),
  columns2(
    '<p><strong>Para:</strong> {{nome_cliente}}<br/>{{empresa_cliente}}</p>',
    '<p><strong>Válida até:</strong> {{validade_proposta}}<br/>Ref: {{numero_proposta}}</p>'
  ),
  divider(),
  heading('Sobre a proposta', 'h2', 'left'),
  text('<p>Prezado(a) {{nome_cliente}},</p><p>É com satisfação que apresentamos nossa proposta para {{descricao_projeto}}. Após análise detalhada das suas necessidades, elaboramos a seguinte proposta:</p>', 'justify'),
  spacer(8),
  heading('Escopo dos serviços', 'h2', 'left'),
  text('<p>{{escopo_servicos}}</p>', 'justify'),
  heading('Investimento', 'h2', 'left'),
  text('<p>O investimento total para este projeto é de <strong>R$ {{valor_total}}</strong>, com as seguintes condições de pagamento: {{condicoes_pagamento}}.</p>', 'justify'),
  heading('Prazo de entrega', 'h2', 'left'),
  text('<p>Estimamos a conclusão do projeto em <strong>{{prazo_entrega}}</strong> após a confirmação e pagamento da entrada.</p>', 'justify'),
  divider(),
  text('<p>Ficamos à disposição para quaisquer esclarecimentos. Aguardamos seu retorno.</p>', 'justify'),
  spacer(16),
  text('<p style="text-align:center">{{cidade}}, {{data_proposta}}</p>', 'center'),
  signature('PROPONENTE', '{{nome_proponente}}'),
]);

const certificado = (): CraftState => buildState([
  spacer(40),
  heading('CERTIFICADO DE CONCLUSÃO', 'h1', 'center'),
  spacer(16),
  text('<p style="text-align:center;font-size:14pt">Certificamos que</p>', 'center'),
  spacer(8),
  heading('{{nome_participante}}', 'h2', 'center'),
  spacer(8),
  text('<p style="text-align:center">concluiu com êxito o(a) <strong>{{nome_curso}}</strong>, com carga horária de <strong>{{carga_horaria}}</strong> horas, realizado em <strong>{{data_realizacao}}</strong>.</p>', 'center'),
  spacer(32),
  divider(),
  spacer(16),
  signature('DIRETOR(A)', '{{nome_diretor}}'),
  spacer(8),
  text('<p style="text-align:center;font-size:10pt;color:#6b7280">{{instituicao}} · {{cidade}}, {{data_emissao}}</p>', 'center'),
]);

const recibo = (): CraftState => buildState([
  heading('RECIBO DE PAGAMENTO', 'h1', 'center'),
  spacer(8),
  text('<p>Recebi de <strong>{{nome_pagador}}</strong>, inscrito(a) no CPF/CNPJ nº <strong>{{cpf_cnpj_pagador}}</strong>, a importância de <strong>R$ {{valor_pago}}</strong> ({{valor_extenso}}), referente a: {{descricao_pagamento}}.</p>', 'justify'),
  spacer(8),
  text('<p>Para maior clareza, firmo o presente recibo declarando nada mais ter a receber a título do pagamento acima descrito.</p>', 'justify'),
  divider(),
  columns2(
    '<p><strong>Forma de pagamento:</strong> {{forma_pagamento}}</p>',
    '<p><strong>Data:</strong> {{data_pagamento}}</p>'
  ),
  spacer(16),
  text('<p style="text-align:center">{{cidade}}, {{data_pagamento}}</p>', 'center'),
  signature('RECEBEDOR', '{{nome_recebedor}}'),
]);

const aluguel = (): CraftState => buildState([
  heading('CONTRATO DE LOCAÇÃO RESIDENCIAL', 'h1', 'center'),
  spacer(8),
  text('<p>Pelo presente instrumento, de um lado <strong>{{nome_locador}}</strong>, CPF nº <strong>{{cpf_locador}}</strong>, doravante <strong>LOCADOR</strong>; e de outro <strong>{{nome_locatario}}</strong>, CPF nº <strong>{{cpf_locatario}}</strong>, doravante <strong>LOCATÁRIO</strong>; celebram o presente contrato de locação:</p>', 'justify'),
  clause('1', 'DO IMÓVEL', '<p>O LOCADOR cede ao LOCATÁRIO o imóvel situado à <strong>{{endereco_imovel}}</strong>, para fins exclusivamente residenciais.</p>'),
  clause('2', 'DO PRAZO', '<p>A locação terá prazo de <strong>{{prazo_meses}}</strong> meses, com início em <strong>{{data_inicio}}</strong> e término em <strong>{{data_termino}}</strong>.</p>'),
  clause('3', 'DO ALUGUEL', '<p>O aluguel mensal é de <strong>R$ {{valor_aluguel}}</strong>, a ser pago até o dia {{dia_vencimento}} de cada mês, mediante depósito bancário ou boleto.</p>'),
  clause('4', 'DO REAJUSTE', '<p>O valor do aluguel será reajustado anualmente pelo índice <strong>{{indice_reajuste}}</strong> acumulado no período.</p>'),
  clause('5', 'DAS DESPESAS', '<p>Ficam a cargo do LOCATÁRIO todas as despesas de consumo de água, luz, gás e condomínio.</p>'),
  clause('6', 'DA CONSERVAÇÃO DO IMÓVEL', '<p>O LOCATÁRIO obriga-se a conservar o imóvel em perfeitas condições, devolvendo-o ao final da locação nas mesmas condições em que o recebeu.</p>'),
  clause('7', 'DA RESCISÃO', '<p>A rescisão antecipada pelo LOCATÁRIO implicará multa equivalente a 3 (três) aluguéis, calculados proporcionalmente ao período restante.</p>'),
  spacer(16),
  text('<p style="text-align:center">{{cidade}}, {{data_assinatura}}</p>', 'center'),
  signature('LOCADOR', '{{nome_locador}}'),
  signature('LOCATÁRIO', '{{nome_locatario}}'),
]);

// ── Exports ────────────────────────────────────────────────────────────────

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'contrato-servicos',
    name: 'Contrato de Prestação de Serviços',
    category: 'CONTRATO',
    description: 'Contrato completo para prestação de serviços com cláusulas padrão',
    icon: '📋',
    craftJson: contratoServicos(),
  },
  {
    id: 'nda',
    name: 'Acordo de Confidencialidade (NDA)',
    category: 'CONTRATO',
    description: 'Modelo de NDA para proteção de informações confidenciais',
    icon: '🔒',
    craftJson: nda(),
  },
  {
    id: 'proposta',
    name: 'Proposta Comercial',
    category: 'PROPOSTA',
    description: 'Proposta comercial profissional com escopo e investimento',
    icon: '💼',
    craftJson: proposta(),
  },
  {
    id: 'certificado',
    name: 'Certificado de Conclusão',
    category: 'CERTIFICADO',
    description: 'Certificado para cursos, treinamentos e eventos',
    icon: '🏆',
    craftJson: certificado(),
  },
  {
    id: 'recibo',
    name: 'Recibo de Pagamento',
    category: 'OUTRO',
    description: 'Comprovante de pagamento com dados do pagador e valor',
    icon: '🧾',
    craftJson: recibo(),
  },
  {
    id: 'aluguel',
    name: 'Contrato de Aluguel Residencial',
    category: 'CONTRATO',
    description: 'Contrato de locação residencial completo conforme Lei do Inquilinato',
    icon: '🏠',
    craftJson: aluguel(),
  },
];
