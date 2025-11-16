import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';

import { appConfig } from './app.config';

// Configuração de servidor sem depender de @angular/ssr,
// evitando erros em builds e testes quando o pacote não está instalado.
const serverConfig: ApplicationConfig = {
  providers: [],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
