# 🚀 Zenith Striker

**Zenith Striker** é um jogo de corrida infinita (*infinite runner*) com temática espacial e estética retrô, desenvolvido inteiramente em **JavaScript Vanilla**. O projeto demonstra a aplicação de lógica de programação avançada, manipulação de Canvas API e síntese de áudio em tempo real.

---

## 🛠️ Tecnologias Utilizadas
* **HTML5 & CSS3:** Interface responsiva com CSS Grid, Flexbox e animações `@keyframes`.
* **JavaScript (ES6+):** Arquitetura baseada em Classes (POO) para gerenciamento de entidades.
* **Canvas API:** Renderização de alta performance (60 FPS), sistemas de partículas e detecção de colisão.
* **Web Audio API:** Uso de `AudioContext` para sintetizar efeitos sonoros (osciladores e ganhos) via código.
* **LocalStorage:** Persistência de dados para o sistema de Ranking Global.

---

## 🌟 Diferenciais Técnicos

### 🔊 Síntese de Áudio via Código
Diferente de jogos que dependem apenas de arquivos `.mp3`, o Zenith Striker utiliza a **Web Audio API** para gerar bips de alerta e efeitos de tiro. Isso reduz o tempo de carregamento e permite controle granular sobre frequências e volumes dinamicamente.

### ⚡ Engine de Partículas e Feedback
O jogo conta com um sistema de partículas para o rastro dos motores e explosões, além de um efeito de **Screen Shake** (trepidação de tela) ao sofrer dano, aumentando a imersão do jogador.

### ⏱️ Dificuldade Progressiva
A dificuldade é calculada em tempo real (`gameSpeed`), aumentando a velocidade dos inimigos e obstáculos de forma assintótica, garantindo que o jogo sempre apresente um desafio ao jogador.

---

## 🎮 Funcionalidades
* **Power-ups:** Escudo de energia, Tiro Triplo, Vida Extra e Câmera Lenta (*Slower*).
* **Sistema de Recordes:** Ranking local que armazena as 10 melhores pontuações (Abates + Distância).
* **Interface HUD:** Painel de status estilizado com ícones de fitas cassete e naves de vida.
* **Pause & Mute:** Atalhos de teclado para pausar (`Enter`) e alternar música (`M`).

---

## 🚀 Como Executar o Projeto

Como o projeto é puramente Front-end, você não precisa instalar nada!

1. Clone o repositório:
   ```bash
   git clone [https://github.com/SEU_USUARIO/zenith-striker.git](https://github.com/SEU_USUARIO/zenith-striker.git)
