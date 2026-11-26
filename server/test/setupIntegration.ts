// Carrega as credenciais locais somente quando a suíte de integração é executada.
// A suíte unitária (pnpm test) não importa este arquivo e não acessa serviços externos.
import "dotenv/config";
