import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import mikroOrmConfig from '../mikro-orm.config';
import { User } from '../../common/entities/user.entity';
import { Template } from '../../common/entities/template.entity';
import { TemplateCategory } from '@docgen/shared';

const CONTRATO_HTML = `
<h1>Contrato de Prestação de Serviços</h1>
<p>
  Pelo presente instrumento, de um lado <strong>{{contratante_nome}}</strong>,
  portador do CPF n.º {{contratante_cpf}}, doravante denominado <em>CONTRATANTE</em>,
  e de outro lado <strong>{{contratado_nome}}</strong>, doravante denominado <em>CONTRATADO</em>,
  têm entre si justo e avençado o seguinte:
</p>

<h2>Cláusula 1ª — Objeto</h2>
<p>
  O CONTRATADO obriga-se a prestar ao CONTRATANTE os serviços a partir de {{data_inicio}}.
</p>

<h2>Cláusula 2ª — Remuneração</h2>
<p>
  O CONTRATANTE pagará ao CONTRATADO o valor de <strong>R$ {{valor}}</strong>.
</p>

<h2>Cláusula 3ª — Foro</h2>
<p>As partes elegem o foro da comarca de São Paulo/SP para dirimir eventuais litígios.</p>
`.trim();

const CERTIFICADO_HTML = `
<div style="text-align:center; border:4px double #1a3a6b; padding:40px;">
  <h1 style="color:#1a3a6b; font-size:28pt; margin-bottom:8px;">CERTIFICADO</h1>
  <h2 style="color:#1a3a6b; font-size:16pt; margin-bottom:32px;">de Conclusão de Curso</h2>
  <p style="font-size:13pt;">Certificamos que</p>
  <p style="font-size:20pt; font-weight:bold; margin:16px 0;">{{aluno_nome}}</p>
  <p style="font-size:13pt;">concluiu com êxito o curso</p>
  <p style="font-size:16pt; font-weight:bold; margin:16px 0;">{{curso_nome}}</p>
  <p style="font-size:12pt;">com carga horária de <strong>{{carga_horaria}} horas</strong></p>
  <p style="font-size:12pt; margin-top:8px;">em {{data_conclusao}}</p>
</div>
`.trim();

async function seed() {
  const orm = await MikroORM.init(mikroOrmConfig);
  const em = orm.em.fork();

  const existingUser = await em.findOne(User, { email: 'dev@docgen.com.br' });
  if (existingUser) {
    console.log('Seed already applied.');
    await orm.close();
    return;
  }

  const passwordHash = await bcrypt.hash('Dev@12345', 12);
  const now = new Date();

  const user = em.create(User, {
    email: 'dev@docgen.com.br',
    name: 'Dev User',
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  em.create(Template, {
    user,
    name: 'Contrato de Prestação de Serviços',
    description: 'Modelo simples de contrato para prestação de serviços com assinaturas.',
    category: TemplateCategory.CONTRATO,
    variables: ['contratante_nome', 'contratante_cpf', 'contratado_nome', 'valor', 'data_inicio'],
    schema: { content: CONTRATO_HTML },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  em.create(Template, {
    user,
    name: 'Certificado de Conclusão de Curso',
    description: 'Certificado formal de conclusão com layout centralizado.',
    category: TemplateCategory.CERTIFICADO,
    variables: ['aluno_nome', 'curso_nome', 'data_conclusao', 'carga_horaria'],
    schema: { content: CERTIFICADO_HTML },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await em.flush();
  console.log('✅ Seed applied: dev@docgen.com.br / Dev@12345');
  await orm.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
