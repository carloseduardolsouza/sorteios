const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pergunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      resolve(resposta);
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function gerarNumeroAleatorio() {
  return Math.floor(Math.random() * 99999) + 1;
}

async function logarInstagram(page, usuario, senha) {
  console.log('🔐 Fazendo login no Instagram...');
  
  await page.goto('https://www.instagram.com/accounts/login/', {
    waitUntil: 'networkidle2'
  });
  
  await delay(2000);
  
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.type('input[name="username"]', usuario, { delay: 100 });
  
  await page.type('input[name="password"]', senha, { delay: 100 });
  
  await page.click('button[type="submit"]');
  
  console.log('⏳ Aguardando login...');
  await delay(5000);
  
  try {
    const botaoSalvarInfo = await page.$('button:has-text("Agora não")');
    if (botaoSalvarInfo) {
      await botaoSalvarInfo.click();
      await delay(1000);
    }
  } catch (e) {}
  
  try {
    const botaoNotificacao = await page.$('button:has-text("Agora não")');
    if (botaoNotificacao) {
      await botaoNotificacao.click();
      await delay(1000);
    }
  } catch (e) {}
  
  console.log('✅ Login realizado com sucesso!');
}

async function comentarComMencoes(page, urlPost, listaMencoes) {
  console.log(`\n📍 Navegando para o post: ${urlPost}`);
  
  await page.goto(urlPost, {
    waitUntil: 'networkidle2'
  });
  
  await delay(3000);
  
  const numeroAleatorio = gerarNumeroAleatorio();
  const textoCompleto = `${listaMencoes.join(' ')} ${numeroAleatorio}`;
  
  console.log(`\n💬 Preparando comentário: ${textoCompleto}`);
  
  try {
    // Fechar popup "Agora não" se aparecer
    console.log('🔘 Procurando botão "Agora não"...');
    const botaoAgoraNao = await page.evaluateHandle(() => {
      const divs = Array.from(document.querySelectorAll('div[role="button"]'));
      return divs.find(div => 
        div.textContent.includes('Agora não') || 
        div.textContent.includes('agora não') ||
        div.textContent.toLowerCase().includes('not now')
      );
    });
    
    if (botaoAgoraNao && (await botaoAgoraNao.asElement())) {
      console.log('✅ Botão "Agora não" encontrado, clicando...');
      await botaoAgoraNao.asElement().click();
      await delay(1500);
    } else {
      console.log('ℹ️ Botão "Agora não" não encontrado (pode já ter sido clicado)');
    }
    
    // Localizar campo de comentário
    const seletorComentario = 'textarea[placeholder*="comentário"], textarea[aria-label*="comentário"], textarea[aria-label*="Adicione um comentário"]';
    await page.waitForSelector(seletorComentario, { timeout: 5000 });
    
    await page.click(seletorComentario);
    await delay(1000);
    
    // Digitar cada menção com espaço entre elas (SEM pressionar Enter)
    for (let i = 0; i < listaMencoes.length; i++) {
      const mencao = listaMencoes[i].trim();
      console.log(`👤 [${i + 1}/${listaMencoes.length}] Digitando menção: ${mencao}`);
      
      await page.type(seletorComentario, mencao, { delay: 150 });
      await delay(500);
      
      // Adicionar espaço entre menções (inclusive após a última)
      console.log('␣ Adicionando espaço...');
      await page.keyboard.press('Space');
      await delay(500);
    }
    
    // Adicionar número aleatório
    console.log(`🎲 Adicionando número aleatório: ${numeroAleatorio}`);
    await page.type(seletorComentario, numeroAleatorio.toString(), { delay: 100 });
    await delay(1000);
    
    // Publicar o comentário
    console.log('📤 Enviando comentário...');
    
    const botaoPostar = await page.evaluateHandle(() => {
      const divs = Array.from(document.querySelectorAll('div[role="button"]'));
      return divs.find(div => div.textContent.includes('Postar') || div.textContent.includes('postar'));
    });
    
    if (botaoPostar && (await botaoPostar.asElement())) {
      await botaoPostar.asElement().click();
      console.log('✅ Comentário publicado!');
    } else {
      console.log('⚠️ Botão "Postar" não encontrado, tentando alternativa...');
      await page.keyboard.down('Control');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Control');
      console.log('✅ Comentário enviado via atalho!');
    }
    
    await delay(2000);
    
  } catch (erro) {
    console.error(`❌ Erro ao comentar:`, erro.message);
    throw erro;
  }
  
  console.log('\n🎉 Comentário concluído!');
}

async function loopInfinito(page, urlPost, listaMencoes) {
  let ciclo = 1;
  
  while (true) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 CICLO ${ciclo} - Postando comentário`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      await comentarComMencoes(page, urlPost, listaMencoes);
      
      console.log('\n⏳ Aguardando 20 segundos antes do próximo ciclo...');
      await delay(20000);
      
      ciclo++;
      
    } catch (erro) {
      console.error(`\n❌ Erro no ciclo ${ciclo}:`, erro.message);
      console.log('⏳ Aguardando 20 segundos antes de tentar novamente...');
      await delay(20000);
    }
  }
}

async function executar() {
  console.log('🤖 === AUTOMAÇÃO INSTAGRAM - MARCAR PESSOAS (LOOP INFINITO) ===\n');
  
  const usuario = "c.souza___";
  const senha = "Didicadu123";
  const urlPost = "https://www.instagram.com/p/DSLvGF7AG_B/?igsh=YnFyYXp5Y3FzemF4";
  const mencoes = "@eluindia,@enzoh9935";
  
  const listaMencoes = mencoes.split(',').map(m => m.trim()).filter(m => m && m.startsWith('@'));
  
  console.log(`\n📋 Total de pessoas a marcar por comentário: ${listaMencoes.length}`);
  console.log(`🔁 Intervalo entre ciclos: 20 segundos`);
  console.log(`♾️ O processo rodará infinitamente até ser interrompido`);
  console.log(`📝 Formato: ${listaMencoes.join(' ')} [número 1-99999]\n`);
  
  const confirmacao = await pergunta('▶️ Deseja continuar? (s/n): ');
  
  if (confirmacao.toLowerCase() !== 's') {
    console.log('❌ Operação cancelada.');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Iniciando automação...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    await logarInstagram(page, usuario, senha);
    await loopInfinito(page, urlPost, listaMencoes);
  } catch (erro) {
    console.error('\n❌ Erro durante a execução:', erro.message);
  } finally {
    console.log('\n🔚 Finalizando...');
    await delay(3000);
    await browser.close();
    rl.close();
  }
}

executar().catch(erro => {
  console.error('❌ Erro fatal:', erro);
  rl.close();
  process.exit(1);
});