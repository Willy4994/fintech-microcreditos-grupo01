import { Cartera } from "./Cartera.js";

export class Cierre {
  constructor(
    public readonly id: string,
    public readonly fechaCorte: Date,
    public readonly cartera: Cartera
  ) {}
}