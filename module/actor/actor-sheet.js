import { cronicasrpg } from '../config.js'
import { prepRoll } from "../dice.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class CronicasActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cronicasrpg", "sheet", "actor"],
      template: "systems/cronicasrpg/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "descricao" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    for (let attr of Object.values(data.data.atributos)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }
    for (let [key, atributo] of Object.entries(data.data.atributos)) {
      for (let [key, especializacao] of Object.entries(atributo.especializacoes)) {
        especializacao.label = game.i18n.localize(cronicasrpg.attributes[key]);
      }
      atributo.label = game.i18n.localize(cronicasrpg.attributes[key]);
    }

    // Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const virtudes = [];
    const fraquezas = [];
    const posses = [];
    const armas = [];
    const armaduras = [];

    // Iterate through items, allocating to containers
    for (let i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to virtues.
      if (i.type == 'virtude') {
        virtudes.push(i);
      }
      // Append to weakness.
      if (i.type == 'fraqueza') {
        fraquezas.push(i);
      }
      // Append to goods.
      if (i.type == 'posse') {
        posses.push(i);
      }
      // Append to weapons.
      if (i.type == 'arma') {
        var array = i.data.especializacaoAcerto.split(".");
        i.acerto = actorData.data.atributos[array[0]][array[1]][array[2]].total;
        armas.push(i);
      }
      // Append to armor.
      if (i.type == 'armadura') {
        armaduras.push(i);
      }
    }

    // Assign and return
    actorData.virtudes = virtudes;
    actorData.fraquezas = fraquezas;
    actorData.posses = posses;
    actorData.armas = armas;
    actorData.armaduras = armaduras;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.toggle-equipped').click(this._onToggleEquipped.bind(this));
    html.find('.toggle-carried').click(this._onToggleCarried.bind(this));


    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }


    for (let [key, atributo] of Object.entries(this.getData().data.atributos)) {
      if (localStorage.getItem('accordion-' + key) === 'true') {
        html.find('#accordion-' + key).click();
      }
      html.on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13 && e.target.type != "textarea") {
          e.preventDefault();
        }
      });
      html.find('#accordion-' + key).on('click', function () {
        if (localStorage.getItem('accordion-' + key) === 'true') {
          localStorage.removeItem('accordion-' + key);
        } else {
          localStorage.setItem('accordion-' + key, true);
        }
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `Nova ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /* -------------------------------------------- */
  //  
  _onToggleCarried(ev) {
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.getOwnedItem(li.data("itemId"));
    if (!item.data.data.equipada) {
      item.data.data.guardado = !item.data.data.guardado;
      item.update({ "data.guardado": item.data.data.guardado });
    }
  }

  /* -------------------------------------------- */
  //  
  _onToggleEquipped(ev) {
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.getOwnedItem(li.data("itemId"));
    if (!item.data.data.guardado) {
      item.data.data.equipada = !item.data.data.equipada;
      item.update({ "data.equipada": item.data.data.equipada });
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event, actor = null) {
    event.preventDefault();
    actor = !actor ? this.actor : actor;
    const a = event.currentTarget;
    const element = event.currentTarget;
    const dataset = element.dataset;
    const itemId = $(a).parents('.item').attr('data-item-id');
    let item = {
      roll: dataset.roll,
      label: dataset.label,
    }

    if (itemId && ($(a).hasClass('virtude-rollable') || $(a).hasClass('fraqueza-rollable') || $(a).hasClass('posse-rollable') || $(a).hasClass('acao-rollable'))) {
      item = actor.getOwnedItem(itemId);
      item.roll = dataset.roll;
      item.label = dataset.label;
    }

    if (itemId && $(a).hasClass('arma-multipla-rollable')) {
      let quantidade = item.roll.split('d')[0];
      quantidade -= 2;
      item.roll = quantidade + 'd6'
      item.label = game.i18n.localize("cronicasrpg.acao.primeiro") + ' ' + dataset.label;
      await prepRoll(event, item, actor);
      item.label = game.i18n.localize("cronicasrpg.acao.segundo") + ' ' + dataset.label;
    }

    await prepRoll(event, item, actor);
  }
}
