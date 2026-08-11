import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'change-tracker-realm',
  clientId: 'change-tracker-client'
});

export default keycloak;
