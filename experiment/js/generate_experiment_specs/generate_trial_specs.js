
// const _ = require('lodash') // uncomment for tests


function filterAlpha(str_in) {
  return str_out = str_in.split('').filter(char => /[a-zA-Z]/.test(char)).join('')
}


function stimProperties(stimFnames, stimCondition) {
  const items = []
  for (i = 0; i < stimFnames.length; i++) {
    const fname = stimFnames[i]
    const dotSplits = fname.split(".")
    if (dotSplits.length != 2) {
      throw new Error("Malformed filename: " + fname)
    }
    const underscoreSplits = dotSplits[0].split("_")
    if (underscoreSplits.length != 2) {
      throw Error("Malformed filename: " + fname)
    }

    if (stimCondition == "baker") {
      var item = {"fname": fname, 
                    "shape": underscoreSplits[0], 
                    "texture": underscoreSplits[1]}
    } else if (stimCondition == "gst") {
      var item = {"fname": fname, 
                    "shape": underscoreSplits[0], 
                    "texture": underscoreSplits[1],
                    "shape_class": filterAlpha(underscoreSplits[0]),
                    "texture_class": filterAlpha(underscoreSplits[1])}
    }
    items.push(item)
  }
  return items
}


function deepCopy(item) {
  const copied = _.cloneDeep(item)
  return copied
}


function sampleKeyMapping(validKeys) {
  if (validKeys.length != 2) {
    throw Error("Expects exactly 2 valid keys")
  }
  const order = _.shuffle(validKeys)
  const mapping = {"yes": order[0],
                   "no": order[1]}
  return mapping
}


/**
* Given a target item and a list of other items, find all items that could be:
*   - shape lure 
*   - texture lure
*   - filler 
* In all of these cases, we record the target as a new field and add a role
*   descriptor.
*/
function optionsByRole(target, items, stimCondition) {
  const shapeLures = []
  const textureLures = []
  const fillers = []
  for (i = 0; i < items.length; i++) {
    const item = deepCopy(items[i])
    if (item["fname"] != target["fname"]) { // Filter exact match.
      item["target"] = target["fname"]
      if (item["shape"] == target["shape"]) {
        item["role"] = "shapeLure"
        shapeLures.push(item)
      } else if (item["texture"] == target["texture"]) {
        item["role"] = "textureLure"
        textureLures.push(item)
      } else {
        if (stimCondition == "gst") { 
          // Exclude items with diff instances of target shape, texture classes
          //  as either the shape or texture.
          if (item["shape_class"] != target["shape_class"] && 
              item["texture_class"] != target["texture_class"] &&
              item["shape_class"] != target["texture_class"] &&
              item["texture_class"] != target["shape_class"]) {
            item["role"] = "filler"
            fillers.push(item)
          }
        } else if (stimCondition == "baker") {
          item["role"] = "filler"
          fillers.push(item)
        }
      }
    }
  }

  if (shapeLures.length == 0) {throw new Error("Empty shape lures")}
  if (textureLures.length == 0) {throw new Error("Empty texture lures")}
  if (fillers.length == 0) {throw new Error("Empty fillers")}

  if (stimCondition == "gst") { // Match number of shape and texture lure options.
    const numLures = Math.min(shapeLures.length, textureLures.length)
    return [sampleWithoutReplacement(shapeLures, numLures), 
            sampleWithoutReplacement(textureLures, numLures), fillers]
  } else if (stimCondition == "baker") {
    return [shapeLures, textureLures, fillers]
  }
}


function sampleWithoutReplacement(arr, numSamples) {
  if (arr.length == 0) {throw new Error("Empty arr")}

  if (numSamples > arr.length) {throw new Error("Too many samples requested")}

  return _.shuffle(arr).slice(0, numSamples)
}


function sampleWithReplacement(arr, numSamples) {
  if (arr.length == 0) {throw new Error("Empty arr")}

  const out = []
  for (i = 0; i < numSamples; i++) {
    out.push(deepCopy(_.sample(arr)))
  }
  return out
}


function trialTypesPerMegablock(numBlocksPerTarget, numTrialsPerBlock) {
  // Returns specifications for a megablock as number of trials per each
  //  trial type.
  const numTrialsPerMegablock = numBlocksPerTarget * numTrialsPerBlock
  if (numTrialsPerMegablock % 2 != 0) {
    throw new Error("Infeasible trial parameters")
  }
  const numExactMatch = Math.floor(numTrialsPerMegablock/2)
  const numNonMatch = numTrialsPerMegablock - numExactMatch
  const numShapeLure = Math.floor(numNonMatch/3)
  const numTextureLure = Math.floor(numNonMatch/3)
  const numFiller = numNonMatch - numShapeLure - numTextureLure
  return [numExactMatch, numShapeLure, numTextureLure, numFiller]
}


/**
* Makes a block of trials associated with a target item consisting of:
*   - numExactMatch exact-match trials (shape and texture same as target)
*   - numShapeLure shape-lure trials (shape but not texture same as target)
*   - numTextureLure texture-lure trials (texture but not shape same as target)
*   - numFiller filler trials (neither shape nor texture same as target)
*
* Returns:
*   shuffledBlock, arr of objs where each obj is an item with fields "fname",
*     "shape", "texture", "target" (fname of the target), "role" ("shapeLure",
*     "textureLure", or "filler")
*   target, obj
*/
function megablock(target_in, items, numExactMatch, numShapeLure, numTextureLure, 
  numFiller, stimCondition) {

  // Create target and exact-match items.
  const target = deepCopy(target_in)
  const exactMatch = deepCopy(target_in)
  exactMatch["role"] = "exactMatch"
  exactMatch["target"] = target["fname"]
  target["role"] = "target"
  target["target"] = null
  
  // Gather shape, texture, and filler options.
  const [shapeLures, textureLures, fillers] = optionsByRole(target, items, 
    stimCondition)

  // Build block.
  const block = []
  for (i = 0; i < numExactMatch; i++) {
    block.push(deepCopy(exactMatch))
  }
  block.push(...sampleWithReplacement(shapeLures, numShapeLure))
  block.push(...sampleWithReplacement(textureLures, numTextureLure))
  block.push(...sampleWithReplacement(fillers, numFiller))

  const shuffledBlock = _.shuffle(block)
  return [shuffledBlock, target]
}


function splitMegablockIntoBlocks(allTrialsThisTarget, target, 
  numBlocksPerTarget) {
  if (allTrialsThisTarget.length == 0) {
    throw new Error("allTrialsThisTarget is empty")
  }

  if (allTrialsThisTarget.length % numBlocksPerTarget != 0) {
    throw new Error("Infeasible num blocks per target")
  }

  // Splits a megablock into blocks.
  const step = allTrialsThisTarget.length/numBlocksPerTarget
  const blockStartInds = _.range(0, allTrialsThisTarget.length, step)

  const blocks = []
  for (i = 0; i < blockStartInds.length; i++) {
    const block = [deepCopy(target)]
    block.push(...allTrialsThisTarget.slice(blockStartInds[i], 
      blockStartInds[i]+step))
    blocks.push(block)
  }
  return blocks
}


/**
* Given specified numbers of targets, blocks per target, and trials per block,
*   generates an array of trials consisting of randomly ordered blocks. 
*
*   - Each block contains a target followed by a mixture of exact-match, 
*     shape lure, texture lure, and filler trials in random order. 
*   - There are numBlocksPerTarget throughout the experiment.
*   - Through the numBlocksPerTarget blocks for a given target, there are 50% 
*     exact-match trials, and 50% non-match trials (appx 1/3 each of shape lure, 
*     texture lure, and filler). 
*
* Returns:
*   allTrials, arr of objects where each object is a trial with fields "fname",
*     "shape", "texture", "role", and "target" (fname of the target 
*     corresponding to the trial)
*/
function generateTrialSpecs(stimFnames, stimCondition, numTargets, 
  numBlocksPerTarget, numTrialsPerBlock) {

  // Get stim characteristics.
  const items = stimProperties(stimFnames, stimCondition)

  // Sample targets.
  const targets = sampleWithReplacement(items, numTargets)

  // Determine experiment specs.
  const [numExactMatch, numShapeLure, numTextureLure, 
    numFiller] = trialTypesPerMegablock(numBlocksPerTarget, numTrialsPerBlock)

  // Create blocks for each target.
  const blocks = []
  var i = 0
  while (i < numTargets) {
    // Make all trials for current target.
    var [allTrialsThisTarget, target] = megablock(targets[i], items, 
      numExactMatch, numShapeLure, numTextureLure, numFiller, stimCondition)

    // Split trials apart into specified number of blocks.
    blocks.push(...splitMegablockIntoBlocks(allTrialsThisTarget, target, 
      numBlocksPerTarget))

    i += 1
  }

  // Shuffle order of blocks.
  const shuffledBlocks = _.shuffle(blocks)

  // Add block and trial identifiers
  for (i = 0; i < shuffledBlocks.length; i++) {
    for (j = 0; j < shuffledBlocks[i].length; j++) {
      shuffledBlocks[i][j]["block_num"] = i
      shuffledBlocks[i][j]["trial_num"] = j
    }
  }

  // Flatten.
  const allTrials = shuffledBlocks.flat()

  return allTrials
}


function assessResponse(data, yesKey, noKey) {
  
  if (typeof yesKey == "undefined" || yesKey == null) {
    throw new Error("yesKey is undefined")
  } 

  if (typeof noKey == "undefined" || noKey == null) {
    throw new Error("noKey is undefined")
  }

  if (data.role == null) {
    throw new Error("Missing role")
  }

  if (data.response != yesKey & data.response != noKey) {
    if (data.response == null) {
      data.response_type = "noResponse"
    } else {
      data.response_type = "wrongKey"
    }
  } else if (data.role == "exactMatch") {
    if (data.response == yesKey){// yesKey: "same as target"
      data.response_type = "truePositive"
    } else { // noKey: "diff from target"
      data.response_type = "falseNegative"
    }
  } else { // role was not target
    if(data.response == yesKey){
      data.response_type = "falsePositive"
    } else {
      data.response_type = "trueNegative"
    }
  }
  if (["truePositive", "trueNegative"].includes(data.response_type)) {
    data.correct = true
  } else {
    data.correct = false
  }

  return data
}


/**
* Given an array of maskNames, sample a mask that does not match either stimulus
class in terms of shape or texture class. 
*/
function sampleNonmatchMask(maskNames, stimShape, stimTexture) {
  var isValid = false
  while (!isValid) {
    var maskName = _.sample(maskNames)
    var isValid = !maskName.includes(stimShape) && !maskName.includes(stimTexture)
  }
  return maskName
}


// // uncomment for tests
// module.exports = [stimProperties, deepCopy, optionsByRole, megablock, 
//   sampleWithReplacement, sampleWithoutReplacement, trialTypesPerMegablock, 
//   splitMegablockIntoBlocks, generateTrialSpecs, assessResponse, 
//   sampleKeyMapping, sampleNonmatchMask]