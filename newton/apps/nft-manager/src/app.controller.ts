import { Controller } from "@nestjs/common";

interface FixOrdersData {
  trx_hash: string;
}

@Controller()
export class AppController {
  constructor() {}
}
