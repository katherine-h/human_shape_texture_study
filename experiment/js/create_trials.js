
// Utils.
function maskOnFinish(data, section, yesKey, noKey){
  // Provide feedback on practice trials.
  if (section == "practice" || section == "demo") {
    if (data.correct) {
      var alertText = "Correct."
    } else {
      if (data.response_type == "noResponse") {
        var alertText = "No key press detected. Remember to " + 
          "press the '" + yesKey + "' key if the image is exactly " + 
          "the same as the target, and the '" + noKey + "' key if " 
          "it is not."
      } else if (data.response_type == "wrongKey") {
        var alertText = "Invalid key. Remember to press the '" + 
          yesKey + "' key if the image is exactly the same as the " + 
          "target, and the '" + noKey + "' key if it is not."
      } else {
        var alertText = "Incorrect! Remember to press the '" + 
          yesKey + "' key if the image is exactly the same as " + 
          "the target, and the '" + noKey + "' key if it is not."
      }
    }
    alert(alertText)
  }
}


/**
* Assemble trials given trial specifications and parameters.
**/
function assembleTrials(section, trialSpecs, params) {
  // Unpack keyMapping.
  const yesKey = params["keyMapping"]["yes"]
  const noKey = params["keyMapping"]["no"]

  // Assemble trials.
  const trials = []

  // Add section welcome block containing high-level instructions.
  if (section == "demo") {
    sectionPages = "<p>We will begin with a slowed-down PRACTICE section " + 
      "in which we will guide you through the task. Please pay " + 
      "close attention to the instructions.</p><p>Press the <b>'Next'</b> " + 
      "button to proceed.</p>"
  }
  else if (section == "practice") {
    sectionPages = "Now we will do some more practice, this time a little " +
      "faster."
  } else if (section == "experiment") {
    sectionPages = "<p>You have completed the practice session. Everything " + 
      "you see after this is the <b>real experiment</b>. The images will " + 
      "be faster than before.</p>"
  }
  const welcomeBlock = {
    type: "instructions",
    pages: [sectionPages],
    show_clickable_nav: true      
  }
  trials.push(welcomeBlock)

  // Add trials.
  for (i = 0; i < trialSpecs.length; i++) {
    
    // Add inter-trial iterval (iti).
    var itiStimulus = "<div style='font-size:50px; color:white'>+</div>"
    if (section == "demo") {
      itiStimulus += "<p>Look at the cross.</p>"
    }
    const iti = {
      type: "html-keyboard-response",
      stimulus: itiStimulus,
      choices: jsPsych.NO_KEYS,
      trial_duration: params.itiDur,
      data: {
        type: "iti",
        trial_num: trialSpecs[i].trial_num,
        block_num: trialSpecs[i].block_num,
        section: section
      }
    }

    // Determine stimulus type.
    const extraData = deepCopy(trialSpecs[i])
    extraData.section = section
    const stimName = trialSpecs[i].fname
    if (trialSpecs[i].role == "target") {
      // Add target.
      extraData.type = "target"
      const targetPath = params.stimDir + stimName
      const target_trial = {
        type: "image-keyboard-response",
        stimulus: targetPath,
        stimulus_height: params.stimSize,
        stimulus_width: params.stimSize,
        choices: jsPsych.ALL_KEYS,
        prompt: "<p>Please look carefully at " +
          "the image above.</p><p>You are about to see a series " +
          "of images. For each image, press the <b>" + yesKey + "</b> key if " +
          "the image is <b>exactly</b> the same as <b>this one</b>, " + 
          "and the <b>" + noKey + "</b> key if it is not.</p><p>Respond as " + 
          "quickly and accurately as possible. In between images, look " + 
          "at the white cross. Remember to take a close look at the image " + 
          "above before you start.</p><p>When you are ready, press any " + 
          "key to begin.</p>",
        response_ends_trial: true,
        data: extraData
      }
      trials.push(target_trial)
      trials.push(iti)

    } else {
      // Add stimulus.
      extraData.type = "option"
      const stimPath = params.stimDir + stimName
      var stimText = ""
      if (section == "demo"){
        stimText += "<p>Exactly the same as the target?</p>"
      }
      const stim_trial = {
        type: "image-keyboard-response",
        stimulus: stimPath,
        stimulus_height: params.stimSize,
        stimulus_width: params.stimSize,
        choices: jsPsych.NO_KEYS, // no responses permitted during stimulus
        prompt: stimText,
        stimulus_duration: null,
        trial_duration: params.stimDur,
        response_ends_trial: false,
        data: extraData
      }
      trials.push(stim_trial)

      // Select mask (if required).
      if (maskCondition !== "nomask") {
        // Add mask (randomly sampled).
        if (maskCondition == "scramble") {
          // Ensure scramble mask does not match stimulus shape or texture.
          if (stimCondition == "baker") {
            // Does not match shape or texture class.
            maskName = sampleNonmatchMask(maskNames, trialSpecs[i].shape_class, 
              trialSpecs[i].texture_class) 
          } else if (stimCondition == "gst") {
            maskName = sampleNonmatchMask(maskNames, trialSpecs[i].shape, 
              trialSpecs[i].texture) 
          }
        } else {
          maskName = _.sample(maskNames)
        }
        var maskPath = params.maskDir + maskName
      }
      
      // Add mask trial.
      var maskText = ""
      if (section == "demo"){
        if (i == 0 || i == 1) {
          if (maskCondition !== "nomask") {
            maskText += "<p>(Ignore the image above.)</p>"
          }
        }
        maskText += "<p>Respond now ('" + yesKey + "' for same, '" + noKey + 
          "' for different)</p>"
      }

      if (maskCondition == "nomask") {
        var maskResponseStimulus = "<div style='font-size:50px; color:red'>+</div>"

        var maskTrial = {
          type: "html-keyboard-response",
          stimulus: maskResponseStimulus,
          choices: jsPsych.ALL_KEYS,
          prompt: maskText,
          stimulus_duration: null,
          trial_duration: params.maskDur,
          response_ends_trial: false,
          data: {
            type: "mask",
            mask_fname: null,
            fname: trialSpecs[i].fname,
            shape: trialSpecs[i].shape,
            texture: trialSpecs[i].texture,
            role: trialSpecs[i].role,
            target: trialSpecs[i].target,
            trial_num: trialSpecs[i].trial_num,
            block_num: trialSpecs[i].block_num,
            section: section
          },
          // Define data collection function.
          on_finish: function(data) {
            // Determine response type (true positive, false negative, etc.) 
            //  and whether correct.
            data = assessResponse(data, yesKey, noKey)
            maskOnFinish(data, section, yesKey, noKey)
          }
        }
      } else {
        var maskTrial = {
          type: "image-keyboard-response",
          stimulus: maskPath,
          stimulus_height: params.stimSize,
          stimulus_width: params.stimSize,
          choices: jsPsych.ALL_KEYS,
          prompt: maskText,
          stimulus_duration: null,
          trial_duration: params.maskDur,
          response_ends_trial: false,
          data: {
            type: "mask",
            mask_fname: maskName,
            fname: trialSpecs[i].fname,
            shape: trialSpecs[i].shape,
            texture: trialSpecs[i].texture,
            role: trialSpecs[i].role,
            target: trialSpecs[i].target,
            trial_num: trialSpecs[i].trial_num,
            block_num: trialSpecs[i].block_num,
            section: section
          },
          // Define data collection function.
          on_finish: function(data) {
            // Determine response type (true positive, false negative, etc.) 
            //  and whether correct.
            data = assessResponse(data, yesKey, noKey)
            maskOnFinish(data, section, yesKey, noKey)
          }
        }
      }
      trials.push(maskTrial)
      trials.push(iti)
    }
  }
  return trials
}