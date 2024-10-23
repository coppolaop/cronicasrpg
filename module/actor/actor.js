/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class CronicasActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    this._evaluateAttributes();
    this._evaluateMovement();

    if (game.settings.get("cronicasrpg", "autoCalcExp")) {
      this._evaluateExperience();
    }

    if (game.settings.get("cronicasrpg", "autoCalcCmb")) {
      this._evaluateCombatStatus();
    }

    if (game.settings.get("cronicasrpg", "autoCalcPen")) {
      this._evaluatePenalties();
    }
  }

  /**
   * Calculate Character attributes according to his actual points and penalities
   */
  _evaluateAttributes() {
    let penalidadeArmadura = 0;

    this.items.forEach(item => {
      if (item.type == "armadura" && item.system.equipada) {
        penalidadeArmadura = item.this.system.penalidade;
      }
    })

    for (let [key, atributo] of Object.entries(this.system.atributos)) {
      atributo.total = atributo.valor + atributo.outros - this.system.penalidades.ferimento - this.system.penalidades.hesitacao - this.system.penalidades.frustracao;
      if (key == "agilidade" || key == "forca" || key == "furtividade") {
        atributo.total -= penalidadeArmadura;
      }
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        especializacao.total = especializacao.valor + especializacao.outros + atributo.total;
      }
    }
  }

  /**
   * Calculate Character spent experience according to his actual attributes and specializations spent points
   */
  _evaluateExperience() {
    this.system.pontos.experiencia.gasta = 0;
    for (let [key, atributo] of Object.entries(this.system.atributos)) {
      this.system.pontos.experiencia.gasta += ((atributo.valor - 2) * 30);
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        this.system.pontos.experiencia.gasta += (especializacao.valor * 10);
      }
    }
    this.system.pontos.experiencia.resto = this.system.pontos.experiencia.valor - this.system.pontos.experiencia.gasta;
  }

  /**
   * Prepare Character combat status according to his actual points and penalities
   */
  _evaluateCombatStatus() {
    let armadura = 0;
    let defesaArma = 0;
    let incrementoVigorFisico = 0;
    let incrementoVigorMental = 0;
    let incrementoVigorSocial = 0;

    this.items.forEach(item => {
      if (item.type == "armadura" && item.system.equipada && (armadura < item.system.absorcao)) {
        armadura = item.system.absorcao;
      }

      if (item.system.defensiva && !item.system.guardado && (defesaArma < item.system.defensivaValor)) {
        defesaArma = item.system.defensivaValor;
      }

      if (item.system.aumentoVigor == "fisico") {
        incrementoVigorFisico += item.system.aumentoVigorValor
      }
      else if (item.system.aumentoVigor == "mental") {
        incrementoVigorMental += item.system.aumentoVigorValor
      }
      else if (item.system.aumentoVigor == "social") {
        incrementoVigorSocial += item.system.aumentoVigorValor
      }
    });

    //Fisico
    this.system.combate.fisico.iniciativa = this.system.atributos[this.system.combate.escolha].valor - this.system.penalidades.ferimento;
    this.system.combate.fisico.defesa = Math.trunc((this.system.atributos.agilidade.valor + this.system.atributos.manejo.valor) / 3) + defesaArma;
    this.system.combate.fisico.absorcao = armadura;
    this.system.combate.fisico.vigor = this.system.atributos.resistencia.valor + incrementoVigorFisico;
    //Mental
    this.system.combate.mental.iniciativa = this.system.atributos.inteligencia.valor - this.system.penalidades.frustracao;
    this.system.combate.mental.defesa = Math.trunc((this.system.atributos.inteligencia.valor + this.system.atributos.conhecimento.valor) / 3);
    this.system.combate.mental.absorcao = this.system.atributos.conhecimento.valor
    this.system.combate.mental.vigor = this.system.atributos.vontade.valor + incrementoVigorMental;
    //Social
    this.system.combate.social.iniciativa = this.system.atributos.labia.valor - this.system.penalidades.hesitacao;
    this.system.combate.social.defesa = Math.trunc((this.system.atributos.blefe.valor + this.system.atributos.labia.valor) / 3);
    this.system.combate.social.absorcao = this.system.pontos.status;
    this.system.combate.social.vigor = this.system.atributos.lideranca.valor + incrementoVigorSocial;
  }

  /**
   * Prepare Character penalties according to his actual vigor
   */
  _evaluatePenalties() {
    //Fisico (ferimento)
    let calculoVigor = (this.system.combate.fisico.vigor * 3) / ((this.system.combate.fisico.vigor * 2) + this.system.combate.fisico.vigorAtual);
    if (calculoVigor < 0 || calculoVigor == Infinity) {
      this.system.penalidades.ferimento = 3;
    } else if (calculoVigor < 1.5) {
      this.system.penalidades.ferimento = 0;
    } else if (calculoVigor < 3) {
      this.system.penalidades.ferimento = 1;
    } else {
      this.system.penalidades.ferimento = 2;
    }
    //Mental (frustracao)
    calculoVigor = (this.system.combate.mental.vigor * 3) / ((this.system.combate.mental.vigor * 2) + this.system.combate.mental.vigorAtual);
    if (calculoVigor < 0 || calculoVigor == Infinity) {
      this.system.penalidades.frustracao = 3;
    } else if (calculoVigor < 1.5) {
      this.system.penalidades.frustracao = 0;
    } else if (calculoVigor < 3) {
      this.system.penalidades.frustracao = 1;
    } else {
      this.system.penalidades.frustracao = 2;
    }
    //Social (hesitacao)
    calculoVigor = (this.system.combate.social.vigor * 3) / ((this.system.combate.social.vigor * 2) + this.system.combate.social.vigorAtual);
    if (calculoVigor < 0 || calculoVigor == Infinity) {
      this.system.penalidades.hesitacao = 3;
    } else if (calculoVigor < 1.5) {
      this.system.penalidades.hesitacao = 0;
    } else if (calculoVigor < 3) {
      this.system.penalidades.hesitacao = 1;
    } else {
      this.system.penalidades.hesitacao = 2;
    }
  }

  /**
   * Calculate Character movement according to his penalities
   */
  _evaluateMovement() {
    let fardo = 0;
    let penalidade = 0;

    this.items.forEach(item => {
      let itemData = item.system;
      if (item.type == "armadura" && itemData.equipada) {
        penalidade = itemData.penalidade;
      }
      if (itemData.fardo && !itemData.guardado) {
        fardo++;
      }
    });

    if (fardo > penalidade) {
      penalidade = fardo;
    }

    this.system.movimentacao.base = Number(game.settings.get("cronicasrpg", "baseMovement"));
    this.system.movimentacao.penalidade = penalidade;
    this.system.movimentacao.total = this.system.movimentacao.base + this.system.movimentacao.outros - penalidade;
  }
}