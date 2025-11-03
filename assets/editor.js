(function () {
  const data = window.UPDefineInnerDefaultsData || {};
  const rules = Array.isArray(data.rules) ? data.rules.filter(Boolean) : [];

  if (!rules.length || !window.wp || !wp.data) {
    return;
  }

  const { select, dispatch, subscribe } = wp.data;
  const blockEditorStoreName = 'core/block-editor';
  const selectEditor = () => select(blockEditorStoreName);
  const dispatchEditor = () => dispatch(blockEditorStoreName);

  if (!selectEditor() || !dispatchEditor()) {
    return;
  }

  const processed = new Set();
  const STYLE_CLASS_PREFIX = 'is-style-';

  function toClassList(value) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function getBlockClassList(block) {
    if (!block || !block.attributes) {
      return [];
    }
    const className = block.attributes.className || '';
    return toClassList(className);
  }

  function removeStyleClasses(classList) {
    return classList.filter((cls) => !cls.startsWith(STYLE_CLASS_PREFIX));
  }

  function applyRuleToBlock(block, rule) {
    if (!block || !rule) {
      return;
    }

    const currentClasses = getBlockClassList(block);
    let updatedClasses = currentClasses.slice();

    if (rule.removeStyleClasses) {
      updatedClasses = removeStyleClasses(updatedClasses);
    }

    if (rule.variationClass && !updatedClasses.includes(rule.variationClass)) {
      updatedClasses.push(rule.variationClass);
    }

    const additionalClasses = toClassList(rule.addClasses);
    additionalClasses.forEach((cls) => {
      if (!updatedClasses.includes(cls)) {
        updatedClasses.push(cls);
      }
    });

    const ruleAttributes = rule.attributes || {};
    const attrClassList = toClassList(ruleAttributes.className);
    attrClassList.forEach((cls) => {
      if (!updatedClasses.includes(cls)) {
        updatedClasses.push(cls);
      }
    });

    const attributesToApply = Object.assign({}, ruleAttributes);
    const nextClassName = updatedClasses.join(' ');
    attributesToApply.className = nextClassName || undefined;

    dispatchEditor().updateBlockAttributes(block.clientId, attributesToApply);
  }

  function parentMatchesRule(parentBlock, rule) {
    if (!rule.parentBlock && !rule.parentClasses?.length) {
      return true;
    }

    if (!parentBlock) {
      return false;
    }

    if (rule.parentBlock && parentBlock.name !== rule.parentBlock) {
      return false;
    }

    if (rule.parentClasses && rule.parentClasses.length) {
      const parentClasses = getBlockClassList(parentBlock);
      const missingClass = rule.parentClasses.some((cls) => !parentClasses.includes(cls));
      if (missingClass) {
        return false;
      }
    }

    return true;
  }

  function findMatchingAncestors(block, rule) {
    const parents = selectEditor().getBlockParents(block.clientId, true) || [];
    if (!parents.length) {
      return [];
    }

    const targetParents = rule.matchAncestors ? parents : parents.slice(0, 1);
    const matched = [];

    targetParents.forEach((parentClientId) => {
      const parentBlock = selectEditor().getBlock(parentClientId);
      if (parentMatchesRule(parentBlock, rule)) {
        matched.push(parentBlock);
      }
    });

    return matched;
  }

  function shouldApplyRule(block, rule) {
    if (!block || !rule) {
      return false;
    }

    if (rule.blockName && block.name !== rule.blockName) {
      return false;
    }

    const matchingParents = findMatchingAncestors(block, rule);
    return matchingParents.length > 0;
  }

  function handleBlock(clientId) {
    const block = selectEditor().getBlock(clientId);
    if (!block) {
      return;
    }

    const applicableRules = rules.filter((rule) => shouldApplyRule(block, rule));
    if (!applicableRules.length) {
      return;
    }

    applicableRules.forEach((rule) => {
      applyRuleToBlock(block, rule);
    });
  }

  function primeProcessedSet() {
    const ids = selectEditor().getClientIdsWithDescendants();
    ids.forEach((id) => processed.add(id));
  }

  primeProcessedSet();

  subscribe(() => {
    const ids = selectEditor().getClientIdsWithDescendants();
    const idsSet = new Set(ids);

    ids.forEach((clientId) => {
      if (!processed.has(clientId)) {
        processed.add(clientId);
        handleBlock(clientId);
      }
    });

    processed.forEach((clientId) => {
      if (!idsSet.has(clientId)) {
        processed.delete(clientId);
      }
    });
  });
})();
