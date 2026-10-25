import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildAlternatingSequence } from "../app/lib/diaporama-sequence";

const products = [{ product_id: 1 }, { product_id: 2 }, { product_id: 3 }];
const messages = [{ id: 10, sortOrder: 2 }, { id: 20, sortOrder: 1 }];

test("every product is preceded by exactly one message, regardless of sort-order grouping", () => {
  const steps = buildAlternatingSequence(products, messages);
  assert.deepEqual(steps.map(step => step.type), ["message", "product", "message", "product", "message", "product"]);
  assert.deepEqual(steps.flatMap(step => step.type === "message" ? [step.message.id] : []), [20, 10, 20]);
  assert.deepEqual(steps.flatMap(step => step.type === "product" ? [step.product.product_id] : []), [1, 2, 3]);
});

test("a single message repeats between products, and empty messages leave all products", () => {
  assert.equal(buildAlternatingSequence(products, messages.slice(0, 1)).filter(step => step.type === "message").length, 3);
  assert.deepEqual(buildAlternatingSequence(products, []).map(step => step.type), ["product", "product", "product"]);
});

test("message rotation continues onto the next board", () => {
  const first = buildAlternatingSequence(products.slice(0, 1), messages, 0);
  const second = buildAlternatingSequence(products.slice(0, 1), messages, 1);
  assert.equal(first[0].type === "message" && first[0].message.id, 20);
  assert.equal(second[0].type === "message" && second[0].message.id, 10);
});
