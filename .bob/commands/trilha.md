---
description: Retorna o plano de estudos de uma trilha DIO pela tecnologia
argument-hint: <tecnologia>
---

O usuário quer consultar a trilha de **$1** na DIO.

Leia o arquivo `dio_explorer/data/trilhas_dio.json` e procure a trilha cuja tecnologia corresponda (parcial ou totalmente, sem diferenciar maiúsculas/minúsculas) ao argumento "$1".

Com os dados encontrados, formate e exiba um plano de estudos completo no seguinte modelo Markdown:

---

# 📚 Plano de Estudos — {nome da trilha}

**🏷️ Tecnologia:** {tecnologia}
**📊 Nível:** {nivel}
**🧩 Módulos:** {numero_de_modulos} módulos
**⭐ XP Total:** {xp_total} XP
**♾️ Acesso Vitalício:** Sim / Não

---

## 🗂️ Cronograma sugerido de módulos

Liste os módulos numerados de 1 até {numero_de_modulos}, criando títulos realistas e progressivos para cada módulo de acordo com a tecnologia. Use seu conhecimento sobre a tecnologia para nomear os módulos de forma coerente (ex.: "Módulo 1 – Fundamentos", "Módulo 2 – Configuração do Ambiente", etc.).

---

## 🏅 Badges disponíveis

Para cada badge em `badges_disponiveis`, exiba um item com emoji de medalha:
- 🥉 {badge 1}
- 🥈 {badge 2}
- 🥇 {badge n}

---

## 🎥 Lives ao Vivo

Se `live_ao_vivo.disponivel` for true, exiba:
> 📡 **Frequência:** {frequencia}
> 🗓️ **Horário:** {dia_hora}

Caso contrário:
> ⚠️ Esta trilha não possui lives ao vivo no momento.

---

## 🏷️ Promoção Ativa

Se `promocoes` não for null, exiba:
> 🎟️ Use o cupom **{cupom}** e ganhe **{desconto_percentual}%** de desconto!
> ⏳ Válido até: {validade}

Caso contrário:
> Nenhuma promoção ativa no momento.

---

Se nenhuma trilha for encontrada para a tecnologia "$1", informe ao usuário que a trilha não foi localizada e liste as tecnologias disponíveis no JSON.
