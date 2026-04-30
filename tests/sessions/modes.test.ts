import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import * as acp from "@agentclientprotocol/sdk";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)(
  "can list and switch modes (%s)",
  async (slug) => {
    const agent = registry.agentBySlug(slug);
    const check = checkCollectorRegistry.get(slug);

    using proc = new AgentProcess(agent);
    const connection = proc.connect();
    await initAndAuth(connection, agent);

    const session = await connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    expect(session.sessionId).toBeTruthy();

    session.configOptions!.forEach((option) => {
      expect(option.id).toBeTruthy();
      expect(option.name).toBeTruthy();
    });

    const modeOptions = session.configOptions!.filter(
      (option) => option.category === "mode",
    );

    if (modeOptions.length > 0) {
      check.pass(
        "listing-modes",
        `${agent.name} advertised ${modeOptions.length} mode option(s).`,
      );
    } else {
      check.fail(
        "listing-modes",
        `${agent.name} did not advertise any session mode options.`,
      );
    }

    if (modeOptions.length != 1) {
      throw new Error("Expected only one mode option");
    }

    const modeOption = modeOptions[0]!;

    if (modeOption.type !== "select" || !modeOption.options) {
      throw new Error(
        "Expected mode option to be a select option with options",
      );
    }

    const currentModeValue = modeOption.currentValue as string;
    const allModeValues = (
      modeOption.options as acp.SessionConfigSelectOption[]
    ).map((v) => v.value);
    const modeValueToChangeTo = allModeValues.find(
      (v) => v !== currentModeValue,
    );

    if (!modeValueToChangeTo) {
      throw new Error("Expected to find a different mode value to change to");
    }

    const switchModeStart = performance.now();

    const setModeResult = await connection.setSessionConfigOption({
      sessionId: session.sessionId,
      configId: modeOption.id,
      value: allModeValues.find((v) => v !== currentModeValue)!,
    });

    const switchModeElapsed = performance.now() - switchModeStart;

    const newConfigOptions = setModeResult.configOptions;
    const newModeOptions = newConfigOptions!.filter(
      (option) => option.category === "mode",
    );

    if (newModeOptions.length != 1) {
      throw new Error("Expected only one mode option after setting new mode");
    }

    const newModeOption = newModeOptions[0]!;

    if (newModeOption.type !== "select" || !newModeOption.options) {
      throw new Error(
        "Expected mode option to be a select option with options after setting new mode",
      );
    }

    const newCurrentModeValue = newModeOption.currentValue as string;

    if (newCurrentModeValue !== modeValueToChangeTo) {
      throw new Error(
        "Expected current mode value to change after setting new mode",
      );
    }

    const switchModeElapsedMs = Math.round(switchModeElapsed);

    check.pass(
      "switch-mode",
      `${agent.name} switched mode from ${currentModeValue} to ${modeValueToChangeTo}.`,
    );

    if (switchModeElapsed <= 500) {
      check.pass(
        "switch-mode-500ms",
        `${agent.name} switched mode from ${currentModeValue} to ${modeValueToChangeTo} in ${switchModeElapsedMs}ms.`,
      );
    } else {
      check.fail(
        "switch-mode-500ms",
        `${agent.name} switched mode from ${currentModeValue} to ${modeValueToChangeTo} in ${switchModeElapsedMs}ms, exceeding the 500ms target.`,
      );
    }
  },
);
