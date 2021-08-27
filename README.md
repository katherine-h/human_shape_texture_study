# human_shape_texture_study

These scripts underlie an in-progress human behavioral experiment being conducted by Katherine Hermann (Stanford University) and Chaz Firestone (Johns Hopkins University).


## Setup

* To enable running experiment, add a directory named `jsPsych` [1] containing the jsPsych==6.3.0 files to `experiment/js/`. 

* To enable running tests (written in Jest), navigate to `generate_experiment_specs`, install Node and npm, and run `npm install`. To run tests: `npm test`.

* To support running the experiment with the "gst" images, copy the stimuli from https://github.com/rgeirhos/texture-vs-shape (do not preserve the subdirectory structure).

* Gst scramble masks are available upon request.


## Experiment

The main experiment script (`experiment/main.html`) supports 2 stimulus sets and 3 mask types, for a total of 6 possible experiments. 

* Set the `stimCondition` to "gst" (Geirhos Style Transfer images) or "baker" (Baker images).

* Set the `maskCondition` to "pinknoise", "scramble" (scramble masks; will use scrambles corresponding to the `stimCondition`), or "nomask" (shows a red fixation cross during the response period).

* If running as experiment, replace `redirectUrl` with a valid Prolific study url.


## Images

Baker images and scramble masks were generated from materials provided by Nicholas Baker [2], and are included here by permission of authors.

Geirhos Style Transfer images are from [3]. 


## References

[1] De Leeuw, J. R. (2015). jsPsych: A JavaScript library for creating behavioral experiments in a Web browser. Behavior research methods, 47(1), 1-12.

[2] Baker, N., Lu, H., Erlikhman, G., & Kellman, P. J. (2018). Deep convolutional networks do not classify based on global object shape. PLoS computational biology, 14(12), e1006613.

[3] Geirhos, R., Rubisch, P., Michaelis, C., Bethge, M., Wichmann, F. A., & Brendel, W. (2018). ImageNet-trained CNNs are biased towards texture; increasing shape bias improves accuracy and robustness. arXiv preprint arXiv:1811.12231.