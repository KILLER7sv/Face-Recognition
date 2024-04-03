# base64-to-tensor

[![Build and lint](https://github.com/A11yWatch/base64-to-tensor/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/A11yWatch/base64-to-tensor/actions/workflows/tests.yml)

pure js convert a base64 image to tensor

## Installation

```
npm i base64-to-tensor --save
```

## Getting Started

Make sure to have `@tensorflow/tfjs-core` installed and a valid tensorflow backend set.
You also need to pick between [sync package jpeg-js](https://github.com/jpeg-js/jpeg-js) or [async package sharp](https://github.com/lovell/sharp).

```sh
# pure js full sync blocking installation
npm i @tensorflow/tfjs-core jpeg-js
# if going to use async non blocking
npm i @tensorflow/tfjs-core sharp
```

View the [convert.test.ts](./__tests__/convert.test.ts) file for an example setup.

```ts
import { convert, convertAsync } from "base64-to-tensor";
import { setBackend } from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-wasm";

await setBackend("wasm");

const tensor = convert(mybase64); // The base64 must be a valid jpeg image.
// or use native sharp for increased performance 2x [Expiremental]
const tensor = await convertAsync(mybase64);
// output example
// {
//       kept: false,
//       isDisposedInternal: false,
//       shape: [189, 300, 3],
//       dtype: "int32",
//       size: 170100,
//       strides: [900, 3],
//       dataId: { id: 1 },
//       id: 1,
//       rankType: "3",
//     }
```

## Why

The benefits of using pure js to calc the image is in a couple areas:

1. size and portablity required is drastically less since you do not need `cairo` or any of the native img dev converters.
1. speed is also faster since the calcs are done at hand without needing to bridge any calls.
1. can use tensors in worker threads - allows for properly using Tensorflow wasm backends in an API service 🥳.

## Benchmarks

Examples of some test ran on a mac m1(64gb):

| Name | chars | size     | sync  | async |
| ---- | ----- | -------- | ----- | ----- |
| jpeg | 26791 | 26.16 KB | 100ms | 50ms  |
