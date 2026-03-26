// Ritual battle definitions and runtime helpers
Game.RitualBattles = (function() {
  var ITEM_ID_ALIASES = {
    daruma_eye: 'darumaEye'
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeItemId(itemId) {
    if (!itemId) return itemId;
    return ITEM_ID_ALIASES[itemId] || itemId;
  }

  function createInputUnlocks() {
    return {
      clickHpBar: false,
      dragItem: false,
      dragDice: false,
      dropToEnemy: false,
      dropToSlot: false
    };
  }

  function createBaseRitualState() {
    return {
      eyeRepaired: false,
      hpZeroReached: false,
      lastLowDiceHit: false,
      overCoolPenalty: false,
      resonanceCreated: false,
      reviewPhaseIndex: 0,
      targetZoneRevealed: false
    };
  }

  function createSlots(mode, params) {
    var slots = [];
    var i;
    if (mode === 'repair_eye') {
      var eyeSlotCount = params.eyeSlotCount || 1;
      for (i = 0; i < eyeSlotCount; i++) {
        slots.push({
          id: 'eye_slot_' + (i + 1),
          kind: 'item',
          filled: false,
          itemId: null,
          visible: false
        });
      }
      return slots;
    }

    if (mode === 'offering') {
      var offeringSlotCount = params.slotCount || params.offeringSlotCount || 5;
      for (i = 0; i < offeringSlotCount; i++) {
        slots.push({
          id: 'offering_slot_' + (i + 1),
          kind: 'dice',
          filled: false,
          value: null,
          visible: true
        });
      }
      return slots;
    }

    return slots;
  }

  function createRuntime(enemyId, enemy) {
    var ritualMode = enemy && enemy.ritualMode ? enemy.ritualMode : 'hp';
    var params = enemy && enemy.ritualParams ? clone(enemy.ritualParams) : {};
    return {
      enemyId: enemyId,
      ritualMode: ritualMode,
      ritualGauge: enemy && typeof enemy.ritualGaugeStart === 'number' ? enemy.ritualGaugeStart : 0,
      ritualTargetZone: enemy && enemy.ritualTargetZone ? clone(enemy.ritualTargetZone) : null,
      ritualSlots: createSlots(ritualMode, params),
      ritualHintState: 0,
      ritualFailStyle: enemy && enemy.ritualFailStyle ? clone(enemy.ritualFailStyle) : null,
      ritualItemRequirement: enemy ? normalizeItemId(enemy.ritualItemRequirement || null) : null,
      ritualInputUnlocks: createInputUnlocks(),
      ritualClickableTargets: [],
      ritualForcedHands: enemy && enemy.ritualForcedHands ? clone(enemy.ritualForcedHands) : [],
      ritualStatusHooks: {},
      ritualParams: params,
      ritualState: createBaseRitualState(),
      uiFlags: {
        redraw: true,
        failureOverlay: false,
        silentMoment: false
      },
      storyRefs: {
        getJourneyState: function() {
          return Game.Story && Game.Story.getJourneyState ? Game.Story.getJourneyState() : { respectGauge: 0, catalysts: [] };
        },
        hasCatalyst: function(itemId) {
          return Game.Story && Game.Story.hasCatalyst ? Game.Story.hasCatalyst(normalizeItemId(itemId)) : false;
        }
      }
    };
  }

  function addRespect(delta) {
    if (Game.Story && Game.Story.addRespect) {
      return Game.Story.addRespect(delta || 0);
    }
    return 0;
  }

  function setJourneyFlag(flagName, value) {
    if (!Game.Story) return;
    if (value === false) {
      if (Game.Story.clearFlag) Game.Story.clearFlag(flagName);
      return;
    }
    if (Game.Story.setFlag) Game.Story.setFlag(flagName);
  }

  var ritualDefinitions = {
    repair_eye: {
      id: 'repair_eye',

      setup: function(runtime) {
        runtime.ritualHintState = 0;
        if (runtime.ritualSlots[0]) runtime.ritualSlots[0].visible = false;
      },

      onActionResolved: function(runtime, enemy, player, action, result) {
        if (!runtime.ritualState.hpZeroReached && enemy.hp <= 0) {
          enemy.hp = 0;
          runtime.ritualState.hpZeroReached = true;
          runtime.ritualHintState = 1;
          runtime.ritualInputUnlocks.dragItem = true;
          runtime.ritualInputUnlocks.dropToSlot = true;
          if (runtime.ritualSlots[0]) runtime.ritualSlots[0].visible = true;
          addRespect(3);
          return;
        }

        if (runtime.ritualState.hpZeroReached && action && action.id === 'attack' && result) {
          result.damage = 0;
        }

        if (!action || action.id !== 'drop_item_to_eye_slot') return;
        if (normalizeItemId(action.itemId) !== runtime.ritualItemRequirement) {
          addRespect(-5);
          return;
        }

        if (runtime.ritualSlots[0]) {
          runtime.ritualSlots[0].filled = true;
          runtime.ritualSlots[0].itemId = normalizeItemId(action.itemId);
        }
        runtime.ritualState.eyeRepaired = true;
        addRespect(10);
        setJourneyFlag('ritual_eye_repaired', true);
      },

      getExtraActions: function(runtime) {
        if (!runtime.ritualState.hpZeroReached) return [];
        return [{ id: 'drop_item_to_eye_slot', name: '目を入れる' }];
      },

      checkVictory: function(runtime) {
        return runtime.ritualState.eyeRepaired === true;
      },

      checkFailure: function(runtime, enemy, player) {
        return !!(player && player.hp <= 0);
      }
    },

    untangle: {
      id: 'untangle',

      setup: function(runtime, enemy) {
        runtime.ritualGauge = enemy && enemy.ritualParams ? (enemy.ritualParams.maxTangle || 12) : 12;
        runtime.ritualHintState = 0;
      },

      onDiceResolved: function(runtime, enemy, player, diceValues) {
        if (!diceValues || !diceValues.length) return;
        var minDie = Math.min.apply(null, diceValues);
        var maxDie = Math.max.apply(null, diceValues);
        var params = enemy.ritualParams || {};

        if (minDie <= (params.lowDiceThreshold || 2)) {
          runtime.ritualGauge = Math.max(0, runtime.ritualGauge - 3);
          runtime.ritualState.lastLowDiceHit = true;
          runtime.ritualHintState = Math.max(runtime.ritualHintState, 1);
          addRespect(5);
        } else {
          runtime.ritualState.lastLowDiceHit = false;
        }

        if (maxDie >= (params.highDicePenaltyThreshold || 6)) {
          runtime.ritualGauge = Math.min(params.maxTangle || 12, runtime.ritualGauge + 2);
          runtime.ritualHintState = Math.max(runtime.ritualHintState, 2);
          addRespect(-4);
        }
      },

      onActionResolved: function(runtime, enemy, player, action, result) {
        if (action && action.id === 'attack' && result) {
          result.damage = 0;
        }
      },

      checkVictory: function(runtime) {
        return runtime.ritualGauge <= 0;
      },

      checkFailure: function(runtime, enemy, player) {
        var maxTangle = enemy && enemy.ritualParams ? (enemy.ritualParams.maxTangle || 12) : 12;
        return !!(player && player.hp <= 0) || runtime.ritualGauge >= maxTangle + 4;
      }
    },

    temperature: {
      id: 'temperature',

      setup: function(runtime, enemy) {
        var params = enemy.ritualParams || {};
        runtime.ritualGauge = params.startTemperature || 110;
        runtime.ritualTargetZone = {
          min: params.targetMin || 35,
          max: params.targetMax || 50
        };
        runtime.ritualHintState = 0;
      },

      onDiceResolved: function(runtime, enemy, player, diceValues) {
        if (!diceValues || !diceValues.length) return;
        var minDie = Math.min.apply(null, diceValues);
        var maxDie = Math.max.apply(null, diceValues);
        var params = enemy.ritualParams || {};

        if (minDie <= 2) {
          runtime.ritualGauge -= params.lowDiceCoolValue || 15;
          if (!runtime.ritualState.targetZoneRevealed) {
            runtime.ritualState.targetZoneRevealed = true;
            runtime.ritualHintState = 1;
          }
        }

        if (maxDie >= 5) {
          runtime.ritualGauge += params.highDiceHeatValue || 8;
          addRespect(-3);
        }

        if (runtime.ritualGauge < 0) runtime.ritualGauge = 0;
      },

      onActionResolved: function(runtime, enemy, player, action, result) {
        if (action && action.id === 'use_item' && normalizeItemId(action.itemId) === normalizeItemId(runtime.ritualParams.coolingItemId || 'cooling_charm')) {
          runtime.ritualGauge -= 20;
          addRespect(4);
        }

        if (action && action.id === 'attack' && result) {
          result.damage = Math.floor((result.damage || 0) * 0.3);
        }
      },

      checkVictory: function(runtime) {
        if (!runtime.ritualTargetZone) return false;
        return runtime.ritualGauge >= runtime.ritualTargetZone.min &&
          runtime.ritualGauge <= runtime.ritualTargetZone.max;
      },

      checkFailure: function(runtime, enemy, player) {
        var params = enemy.ritualParams || {};
        if (player && player.hp <= 0) return true;
        return runtime.ritualGauge <= (params.freezeFailThreshold || 10);
      }
    }
  };

  function getDefinition(mode) {
    return ritualDefinitions[mode] || null;
  }

  function getAllDefinitions() {
    return ritualDefinitions;
  }

  function getExtraActions(runtime, enemy, player) {
    var definition = runtime ? getDefinition(runtime.ritualMode) : null;
    return definition && definition.getExtraActions ? definition.getExtraActions(runtime, enemy, player) : [];
  }

  return {
    createRuntime: createRuntime,
    getDefinition: getDefinition,
    getAllDefinitions: getAllDefinitions,
    getExtraActions: getExtraActions,
    addRespect: addRespect,
    setJourneyFlag: setJourneyFlag,
    normalizeItemId: normalizeItemId
  };
})();
