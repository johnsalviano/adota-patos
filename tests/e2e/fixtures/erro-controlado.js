// Arquivo de teste: existe para provar que um erro NAO TRATADO,
// lancado de um script real servido pelo site, chega ao Sentry com
// o nome do arquivo e o numero da linha corretos.
//
// Nao faz parte do frontend: e servido apenas pelo servidor de
// teste e injetado na pagina pelo Playwright.
//
// Linha 13 e o local exato do throw, e o que o teste confere.
(function () {
    'use strict';

    setTimeout(function () {
        throw new Error('erro artificial de verificacao');
    }, 0);
})();