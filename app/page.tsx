"use client";

import { StartScreen } from "@/components/start-screen";
import { LevelUpScreen } from "@/components/steps/level-up";
import { LightsUp } from "@/components/steps/lights-up";
import { Opportunities } from "@/components/steps/opportunities";
import { SkillCards } from "@/components/steps/skill-cards";
import { YourFlow } from "@/components/steps/your-flow";
import { usePlayfulFlow } from "@/lib/flow/use-playful-flow";

export default function Home() {
  const flow = usePlayfulFlow();

  if (flow.stage === "start") {
    return (
      <StartScreen
        onStart={flow.start}
        onExample={flow.startExample}
        busy={flow.busy}
        error={flow.error}
      />
    );
  }

  if (flow.stage === "skills") {
    return (
      <SkillCards
        whereIComeFrom={flow.whereIComeFrom}
        skills={flow.proposedSkills}
        index={flow.skillIndex}
        confirmedCount={flow.confirmedSkills.length}
        extraSkill={flow.extraSkill}
        busy={flow.busy}
        error={flow.error}
        onExtraSkill={flow.setExtraSkill}
        onReact={flow.reactToSkill}
        onContinue={flow.confirmSkills}
        onRetry={flow.retrySkills}
      />
    );
  }

  if (flow.stage === "lights") {
    return (
      <LightsUp
        lightsUp={flow.lightsUp}
        tasks={flow.tasks}
        onToggleLight={flow.toggleLight}
        onSetTaskKeep={flow.setTaskKeep}
        onContinue={flow.confirmLights}
      />
    );
  }

  if (flow.stage === "opportunities") {
    return (
      <Opportunities
        opportunities={flow.opportunities}
        index={flow.opportunityIndex}
        interestedCount={flow.interested.length}
        searching={flow.searching}
        searchNote={flow.searchNote}
        savedExample={flow.savedExample}
        roleStories={flow.roleStories}
        onLoadRoleStory={flow.loadRoleStory}
        error={flow.error}
        onReact={flow.reactToOpportunity}
        onSurprise={flow.surpriseMe}
        onFinish={flow.finish}
      />
    );
  }

  if (flow.stage === "levelUp") {
    return (
      <LevelUpScreen
        levelUp={flow.levelUp}
        searching={flow.searching}
        searchNote={flow.searchNote}
        error={flow.error}
        onCollect={flow.collectCard}
        onBack={flow.closeLevelUp}
      />
    );
  }

  return (
    <YourFlow
      flow={flow.flow}
      flowMarkdown={flow.flowMarkdown}
      interested={flow.interested}
      feelingBefore={flow.feelingBefore}
      feelingNow={flow.feelingNow}
      isExample={flow.isExample}
      busy={flow.busy}
      error={flow.error}
      onFeelingNow={flow.setFeelingNow}
      onFindNew={flow.findNewOpportunities}
      onLevelUp={(opportunity) => flow.openLevelUp(opportunity, "flow")}
      onRestart={flow.restart}
    />
  );
}
