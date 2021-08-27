/**
* To use, uncomment module and require lines in `generate_trials_specs.js` and
*   `stim_info.js`.
**/

const [stimProperties, deepCopy, optionsByRole, megablock, 
  sampleWithReplacement, sampleWithoutReplacement, trialTypesPerMegablock, 
  splitMegablockIntoBlocks, generateTrialSpecs, assessResponse, 
  sampleKeyMapping, sampleNonmatchMask] = require(
    "../generate_trial_specs.js")


describe("stimProperties", () => {
  test("well-formed names parse correctly", () => {
    const stimCondition = "baker"
    const fnames = ["binoculars_bison.png", "cannon_otter.png"]
    const expected = [{"fname": "binoculars_bison.png",
                       "shape": "binoculars",
                       "texture": "bison"},
                      {"fname": "cannon_otter.png", 
                       "shape": "cannon",
                       "texture": "otter"}]
    expect(stimProperties(fnames, stimCondition)).toEqual(expected)
  })

  test("well-formed names parse correctly (gst)", () => {
    const stimCondition = "gst"
    const fnames = ["airplane2_bicycle1.png", "bird5_clock1.png"]
    const expected = [{"fname": "airplane2_bicycle1.png",
                       "shape": "airplane2",
                       "texture": "bicycle1",
                       "shape_class": "airplane",
                       "texture_class": "bicycle"},
                      {"fname": "bird5_clock1.png",
                       "shape": "bird5",
                       "texture": "clock1",
                       "shape_class": "bird",
                       "texture_class": "clock"}]
    expect(stimProperties(fnames, stimCondition)).toEqual(expected)
  })

  test("too many dots fails", () => {
    const stimCondition = "baker"
    const name = "binoculars_bison.png.jpg"
    expect(() => stimProperties([name], stimCondition)).toThrowError(
      "Malformed filename: " + name)
  })

  test("too few dots fails", () => {
    const stimCondition = "baker"
    const name = "binoculars_bison"
    expect(() => stimProperties([name], stimCondition)).toThrowError(
      "Malformed filename: " + name)
  })

  test("too many underscores fails", () => {
    const stimCondition = "baker"
    const name = "binoculars_bison_otter.png"
    expect(() => stimProperties([name], stimCondition)).toThrowError(
      "Malformed filename: " + name)
  })

  test("too many underscores fails", () => {
    const stimCondition = "baker"
    const name = "binocularsotter.png"
    expect(() => stimProperties([name], stimCondition)).toThrowError(
      "Malformed filename: " + name)
  })
})


describe("deepCopy", () => {
  const orig = {"fname": "binoculars_bison.png",
                "shape": "binoculars",
                "texture": "bison"}

  test("copy matches orig", () => {
    const copied = deepCopy(orig)
    expect(copied["fname"]).toEqual("binoculars_bison.png")
    expect(copied["shape"]).toEqual("binoculars")
    expect(copied["texture"]).toEqual("bison")
  })

  test("adding field to copy does not add to orig", () => {
    const copied = deepCopy(orig)
    copied["newField"] = "newValue"
    expect(copied).toHaveProperty("newField")
    expect(orig).not.toHaveProperty("newField")
  })

  test("changing field in copy does not change orig", () => {
    const copied = deepCopy(orig)
    copied["shape"] = "newShape"
    expect(copied["shape"]).toEqual("newShape")
    expect(orig["shape"]).toEqual("binoculars")
  })
})


describe("sampleKeyMapping", () => {

  // test("returns valid options", () => {
  //   const validKeys = ["j", "k"]
  //   const validMappings = [{"yes": "j", "no": "k"},
  //                          {"yes": "k", "no": "j"}]
  //   for (i = 0; i < 50; i++) {
  //     const mapping = sampleKeyMapping(validKeys)
  //     console.log(mapping)
  //   }
  // })

  test("wrong validKeys length throws error", () => {
    expect(() => sampleKeyMapping(["j", "k", "m"])).toThrowError(
      "Expects exactly 2 valid keys")
    expect(() => sampleKeyMapping([])).toThrowError(
      "Expects exactly 2 valid keys")
  })
})


describe("optionsByRole", () => {
  const stimCondition = "baker" 

  const target = {"fname": "binoculars_bison.png",
                  "shape": "binoculars",
                  "texture": "bison"}

  const shapeLures = [{"fname": "binoculars_otter.png",
                       "shape": "binoculars",
                       "texture": "otter"},
                      {"fname": "binoculars_gong.png",
                       "shape": "binoculars",
                       "texture": "gong"}]

  const textureLures = [{"fname": "plane_bison.png",
                         "shape": "plane",
                         "texture": "bison"},
                        {"fname": "otter_bison.png",
                         "shape": "otter",
                         "texture": "bison"}]

  const fillers = [{"fname": "plane_otter.png",
                    "shape": "plane",
                    "texture": "otter"},
                   {"fname": "bison_binoculars.png",
                    "shape": "bison",
                    "texture": "binoculars"}]

  const items = [target]
  items.push(...shapeLures)
  items.push(...textureLures)
  items.push(...fillers)

  let addTargetAndRole = function(s, role){
    const ss = deepCopy(s)
    ss["target"] = target["fname"]
    ss["role"] = role
    return ss
  }

  const expectedShapeLures = shapeLures.map(s => addTargetAndRole(
    s, "shapeLure"))
  const expectedTextureLures = textureLures.map(s => addTargetAndRole(
    s, "textureLure"))
  const expectedFillers = fillers.map(s => addTargetAndRole(
    s, "filler"))

  test("options chosen are correct", () => {
    const [shapeLuresOut, textureLuresOut, fillersOut] = optionsByRole(
      target, items, stimCondition)
    expect(shapeLuresOut).toEqual(expectedShapeLures)
    expect(textureLuresOut).toEqual(expectedTextureLures)
    expect(fillersOut).toEqual(expectedFillers)
  })

  test("empty shape lures throws error", () => {
    const items = [target]
    items.push(...textureLures)
    items.push(...fillers)
    expect(() => optionsByRole(target, items, stimCondition)).toThrowError(
      "Empty shape lures")
  })

  test("empty texture lures throws error", () => {
    const items = [target]
    items.push(...shapeLures)
    items.push(...fillers)
    expect(() => optionsByRole(target, items, stimCondition)).toThrowError(
      "Empty texture lures")
  })

  test("empty fillers throws error", () => {
    const items = [target]
    items.push(...shapeLures)
    items.push(...textureLures)
    expect(() => optionsByRole(target, items, stimCondition)).toThrowError(
      "Empty fillers")
  })
})


describe("sampleWithReplacement", () => {
  test("returns correct number of samples", () => {
    const arr = ["A", "B", "C", "D", "E"]
    const numSamples = 10
    expect(sampleWithReplacement(arr, numSamples).length).toEqual(numSamples)
  })

  test("empty array throws error", () => {
    const arr = []
    const numSamples = 10
    expect(() => sampleWithReplacement(arr, numSamples)).toThrowError("Empty arr")
  })
})


describe("sampleWithoutReplacement", () => {
  test("returns correct number of samples", () => {
    for (i = 0; i < 100; i++) {
      const arr = ["A", "B", "C", "D", "E"]
      const numSamples = 2
      var samples = sampleWithoutReplacement(arr, numSamples).length
      expect(samples).toEqual(numSamples)
      expect(samples[0] != samples[1])
    }
  })

  test("empty array throws error", () => {
    const arr = []
    const numSamples = 2
    expect(() => sampleWithoutReplacement(arr, numSamples)).toThrowError("Empty arr")
  })

  test("num samples requested is greater than length of arrary throws error", () => {
    const arr = ["A", "B", "C", "D", "E"]
    const numSamples = 10
    expect(() => sampleWithoutReplacement(arr, numSamples)).toThrowError(
      "Too many samples requested")
  })
})


function trialComposition(trialSpecs) {
  typesToCounts = {"target": 0,
                   "exactMatch": 0, 
                   "shapeLure": 0,
                   "textureLure": 0,
                   "filler": 0}
  for (i = 0; i < trialSpecs.length; i++) {
    typesToCounts[trialSpecs[i]["role"]] += 1
  }
  return typesToCounts
}


describe("megablock", () => {
  const stimCondition = "baker"

  const target_in = {"fname": "binoculars_bison.png",
                     "shape": "binoculars",
                     "texture": "bison"}

  const items = [{"fname": "plane_bison.png",
                  "shape": "plane",
                  "texture": "bison"}, 
                {"fname": "binoculars_otter.png",
                  "shape": "binoculars",
                  "texture": "otter"},
                {"fname": "binoculars_gong.png",
                  "shape": "binoculars",
                  "texture": "gong"},
                {"fname": "bison_binoculars.png",
                  "shape": "bison",
                  "texture": "binoculars"},
                {"fname": "otter_bison.png",
                  "shape": "otter",
                  "texture": "bison"},
                {"fname": "plane_otter.png",
                  "shape": "plane",
                  "texture": "otter"}]

  numExactMatch = 12
  numShapeLure = 4
  numTextureLure = 4
  numFiller = 4

  test("correct number of each trial type", () => {
    const [block, target] = megablock(target_in, items, numExactMatch, numShapeLure, 
      numTextureLure, numFiller, stimCondition)
    const typesToCounts = trialComposition(block)
    expect(typesToCounts["target"]).toEqual(0)
    expect(typesToCounts["exactMatch"]).toEqual(numExactMatch)
    expect(typesToCounts["shapeLure"]).toEqual(numShapeLure)
    expect(typesToCounts["textureLure"]).toEqual(numTextureLure)
    expect(typesToCounts["filler"]).toEqual(numFiller)
  })

})


describe("trialTypesPerMegablock", () => {
  test("correct number of each trial type, single block per target", () => {
    const numBlocksPerTarget = 1
    const numTrialsPerBlock = 50

    const [numExactMatch, numShapeLure, numTextureLure, 
      numFiller] = trialTypesPerMegablock(numBlocksPerTarget, numTrialsPerBlock)
    expect(numExactMatch).toEqual(25)
    expect(numShapeLure).toEqual(8)
    expect(numTextureLure).toEqual(8)
    expect(numFiller).toEqual(9)
  })

  test("correct number of each trial type, multiple blocks per target", () => {
    const numBlocksPerTarget = 2
    const numTrialsPerBlock = 50

    const [numExactMatch, numShapeLure, numTextureLure, 
      numFiller] = trialTypesPerMegablock(numBlocksPerTarget, numTrialsPerBlock)
    expect(numExactMatch).toEqual(50)
    expect(numShapeLure).toEqual(16)
    expect(numTextureLure).toEqual(16)
    expect(numFiller).toEqual(18)
  })

  test("Odd num trials per megablock throws error", () => {
    const numBlocksPerTarget = 1
    const numTrialsPerBlock = 25

    expect(() => trialTypesPerMegablock(numBlocksPerTarget, 
      numTrialsPerBlock)).toThrowError("Infeasible trial parameters")
  })
})


describe("splitMegablockIntoBlocks", () => {
  const target = {"fname": "binoculars_bison.png",
                  "shape": "binoculars",
                  "texture": "bison",
                  "role": "target",
                  "target": null}
  const allTrialsThisTarget = [{fname: 'apron_pineapple.png',
                                shape: 'apron',
                                texture: 'pineapple',
                                role: 'exactMatch',
                                target: 'apron_pineapple.png'
                              },
                              {
                                fname: 'ostrich_pineapple.png',
                                shape: 'ostrich',
                                texture: 'pineapple',
                                target: 'apron_pineapple.png',
                                role: 'textureLure'
                              },
                              {
                                fname: 'apron_pineapple.png',
                                shape: 'apron',
                                texture: 'pineapple',
                                role: 'exactMatch',
                                target: 'apron_pineapple.png'
                              },
                              {
                                fname: 'apron_gong.png',
                                shape: 'apron',
                                texture: 'gong',
                                target: 'apron_pineapple.png',
                                role: 'shapeLure'
                              },
                              {
                                fname: 'apron_pineapple.png',
                                shape: 'apron',
                                texture: 'pineapple',
                                role: 'exactMatch',
                                target: 'apron_pineapple.png'
                              },
                              {
                                fname: 'apron_pineapple.png',
                                shape: 'apron',
                                texture: 'pineapple',
                                role: 'exactMatch',
                                target: 'apron_pineapple.png'
                              }]

  test("correct number of blocks with repeats", () => {
    const numBlocksPerTarget = 2
    const blocks = splitMegablockIntoBlocks(allTrialsThisTarget, target, 
      numBlocksPerTarget)
    expect(blocks.length).toEqual(numBlocksPerTarget)
  })

  test("simplified input split correctly", () => {
    const blocks = splitMegablockIntoBlocks([1, 2, 3, 4, 5, 6, 7, 8], -1, 4)
    expect(blocks.length).toEqual(4)
  })

  test("infeasible specs throws error", () => {
    const numBlocksPerTarget = 5
    expect(() => splitMegablockIntoBlocks(allTrialsThisTarget, target, 
      numBlocksPerTarget)).toThrowError("Infeasible num blocks per target")
  })

  test("empty array throws error", () => {
    const allTrialsThisTarget = []
    const numBlocksPerTarget = 2
    expect(() => splitMegablockIntoBlocks(allTrialsThisTarget, target, 
      numBlocksPerTarget)).toThrowError("allTrialsThisTarget is empty")
  })
})


describe("generateTrialSpecs", () => {
  const stimFnames = require('../../stim_info.js') 
  const stimCondition = "baker"
  const numTargets = 25
  const numBlocksPerTarget = 2
  const numTrialsPerBlock = 50

  // target numbers of trials of each type
  const expectedNumTargets = 50
  const expectedNumExactMatch = 25 * 2 * 25
  const expectedNumShapeLure = 8 * 2 * 25 
  const expectedNumTextureLure = 8 * 2 * 25
  const expectedNumFiller = 9 * 2 * 25 
  const expectedNumTrials = (expectedNumTargets + expectedNumExactMatch + 
    expectedNumShapeLure + expectedNumTextureLure + expectedNumFiller)

  const allTrials = generateTrialSpecs(stimFnames, stimCondition, numTargets, 
      numBlocksPerTarget, numTrialsPerBlock)

  test("correct number of each trial type", () => {
    expect(allTrials.length).toEqual(expectedNumTrials)
    const typesToCounts = trialComposition(allTrials)
    expect(typesToCounts["target"]).toEqual(expectedNumTargets)
    expect(typesToCounts["exactMatch"]).toEqual(expectedNumExactMatch)
    expect(typesToCounts["shapeLure"]).toEqual(expectedNumShapeLure)
    expect(typesToCounts["textureLure"]).toEqual(expectedNumTextureLure)
    expect(typesToCounts["filler"]).toEqual(expectedNumFiller)
  })
})


describe("assessResponse", () => {
  test("responses coded correctly", () => {
    const itemsMapping1 = [
      {"role": "exactMatch", "response": "j"}, // truePositive
      {"role": "exactMatch", "response": "k"}, // falseNegative
      {"role": "exactMatch", "response": "w"},  // wrongKey
      {"role": "exactMatch", "response": null}, // noResponse
      {"role": "textureLure", "response": "j"}, // falsePositive
      {"role": "textureLure", "response": "k"}, // trueNegative
      {"role": "textureLure", "response": "w"}, // wrongKey
      {"role": "textureLure", "response": null}, // noResponse
      {"role": "shapeLure", "response": "j"}, // falsePositive
      {"role": "shapeLure", "response": "k"}, // trueNegative
      {"role": "shapeLure", "response": "w"}, // wrongKey
      {"role": "shapeLure", "response": null}, // noResponse
      {"role": "filler", "response": "j"}, // falsePositive
      {"role": "filler", "response": "k"}, // trueNegative
      {"role": "filler", "response": "w"}, // wrongKey
      {"role": "filler", "response": null}] // noResponse

    const itemsMapping2 = [
      {"role": "exactMatch", "response": "k"}, // truePositive
      {"role": "exactMatch", "response": "j"}, // falseNegative
      {"role": "exactMatch", "response": "w"},  // wrongKey
      {"role": "exactMatch", "response": null}, // noResponse
      {"role": "textureLure", "response": "k"}, // falsePositive
      {"role": "textureLure", "response": "j"}, // trueNegative
      {"role": "textureLure", "response": "w"}, // wrongKey
      {"role": "textureLure", "response": null}, // noResponse
      {"role": "shapeLure", "response": "k"}, // falsePositive
      {"role": "shapeLure", "response": "j"}, // trueNegative
      {"role": "shapeLure", "response": "w"}, // wrongKey
      {"role": "shapeLure", "response": null}, // noResponse
      {"role": "filler", "response": "k"}, // falsePositive
      {"role": "filler", "response": "j"}, // trueNegative
      {"role": "filler", "response": "w"}, // wrongKey
      {"role": "filler", "response": null}] // noResponse
    
    const expectedResponseTypes = [
      "truePositive", "falseNegative", "wrongKey", "noResponse", 
      "falsePositive", "trueNegative", "wrongKey", "noResponse",
      "falsePositive", "trueNegative", "wrongKey", "noResponse", 
      "falsePositive", "trueNegative", "wrongKey", "noResponse"]

    const expectedCorrects = [
      true, false, false, false, 
      false, true, false, false,
      false, true, false, false,
      false, true, false, false]

    for (i = 0; i < itemsMapping1.length; i++) {
      const out1 = assessResponse(itemsMapping1[i], "j", "k")
      expect(out1["response_type"]).toEqual(expectedResponseTypes[i])
      expect(out1["correct"]).toEqual(expectedCorrects[i])

      const out2 = assessResponse(itemsMapping2[i], "k", "j")
      expect(out2["response_type"]).toEqual(expectedResponseTypes[i])
      expect(out2["correct"]).toEqual(expectedCorrects[i])
    }
  })

  test("undefined key throws error", () => {
    expect(() => assessResponse({"role": "filler", "response": "k"}, null, 
      "k")).toThrowError("yesKey is undefined")
    expect(() => assessResponse({"role": "filler", "response": "k"}, undefined, 
      "k")).toThrowError("yesKey is undefined")
    expect(() => assessResponse({"role": "filler", "response": "k"}, "j", 
      null)).toThrowError("noKey is undefined")
    expect(() => assessResponse({"role": "filler", "response": "k"}, "j", 
      undefined)).toThrowError("noKey is undefined")
  })

  test("missing role throws error", () => {
    expect(() => assessResponse({"role": null, "response": "j"}, "j", "k")
      ).toThrowError("Missing role")
  })
})


describe("sampleNonmatchMask", () => {
  test("selects valid option", () => {
    const maskNames = ["plane_bison.png", "cannon_otter.png", 
                       "binoculars_bison.png", "bear_pineapple.png", 
                       "cannon_flamingo.png", "guitar_pineapple.png",
                       "bear_cannon", "pineapple_flamingo"]
    const stimShape = "cannon"
    const stimTexture = "pineapple"
    const validOptions = ["plane_bison.png", "binoculars_bison.png"]

    for (i = 0; i < 10; i++) {
      var sample = sampleNonmatchMask(maskNames, stimShape, stimTexture)
      var valid = validOptions.includes(sample) 
      expect(valid).toEqual(true)
    }
  })

  test("selects valid option (gst)", () => {
    const maskNames = ["bird1_clock3.png", "bird3_clock3.png",
                       "airplane8_keyboard2.png", "airplane8_keyboard1.png",
                       "bird1_keyboard2.png", "bird3_keyboard1.png",
                       "airplane3_clock2.png", "bear2_knife3.png"]
    const stimShape = "bird" // shape class
    const stimTexture = "keyboard" // texture class
    const validOptions = ["airplane3_clock2.png", "bear2_knife3.png"]

    for (i = 0; i < 10; i++) {
      var sample = sampleNonmatchMask(maskNames, stimShape, stimTexture)
      var valid = validOptions.includes(sample) 
      expect(valid).toEqual(true)
    }
  })
})