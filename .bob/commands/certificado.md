---
description: Gera um certificado fictício em Markdown para o usuário e trilha concluída
argument-hint: <nome-do-usuario> <nome-da-trilha>
---

O usuário quer gerar um certificado fictício da DIO.

- **Nome do usuário:** $1
- **Trilha concluída:** $2

Gere um certificado fictício completo e bem formatado em Markdown, seguindo exatamente o template abaixo. Preencha todos os campos com informações coerentes, calculando datas e IDs de forma realista:

---

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎓  CERTIFICADO DE CONCLUSÃO  🎓                    ║
║                      dio.me                                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

# 🏆 Certificado de Conclusão

---

> *A Digital Innovation One certifica que*

## $1

> *concluiu com êxito a trilha de aprendizagem*

## 📚 $2

---

### 📋 Detalhes do Certificado

| Campo                  | Informação                                      |
|------------------------|-------------------------------------------------|
| **👤 Aluno**           | $1                                              |
| **📚 Trilha**          | $2                                              |
| **🏫 Instituição**     | Digital Innovation One — DIO                    |
| **🗓️ Data de Conclusão** | {data de hoje formatada como DD/MM/AAAA}      |
| **⏱️ Carga Horária**   | {entre 40h e 120h, coerente com a trilha}       |
| **📊 Nível**           | {nível adequado à trilha mencionada}            |
| **🆔 ID do Certificado** | DIO-CERT-{8 caracteres alfanuméricos em maiúsculo aleatórios} |
| **✅ Status**          | Aprovado                                        |

---

### 🏅 Competências Certificadas

Liste de 4 a 6 competências técnicas adquiridas ao longo da trilha "$2", de forma objetiva e profissional.

---

### 🌐 Verificação

> Este certificado pode ser verificado em:
> **https://www.dio.me/certificate/{ID gerado acima}**

---

### 🖊️ Assinaturas

```
_________________________________      _________________________________
   Yure Souza                              Claudio Giorgio
   CEO — Digital Innovation One            CTO — Digital Innovation One
```

---

*© {ano atual} Digital Innovation One. Todos os direitos reservados.*
*Este é um certificado fictício gerado para fins educacionais.*

---

Após exibir o certificado, pergunte ao usuário se deseja salvar o certificado como arquivo `.md` em `dio_explorer/docs/certificados-emetidos/{nome-usuario}-{trilha-slug}.md`.
