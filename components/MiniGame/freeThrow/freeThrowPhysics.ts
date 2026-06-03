/**
 * @description  자유투 미니게임 공 궤적을 Matter.js로 선시뮬레이션하는 유틸입니다.
 * @depends      matter-js
 * @used-by      app/miniGame/freeThrowPlay.tsx
 * @side-effects 없음
 */
import Matter from "matter-js";

export type FreeThrowPhysicsOutcome = "overPower" | "success" | "underPower";
export type FreeThrowCollisionKind = "backboard" | "rim" | "score";

export type FreeThrowCollisionEvent = {
  kind: FreeThrowCollisionKind;
  time: number;
  x: number;
  y: number;
};

export type FreeThrowShotFrame = {
  angle: number;
  behindOpacity: number;
  frontOpacity: number;
  scale: number;
  time: number;
  x: number;
  y: number;
};

export type FreeThrowShotSimulation = {
  behindOpacity: number[];
  collisionEvents: FreeThrowCollisionEvent[];
  didScore: boolean;
  duration: number;
  frontOpacity: number[];
  hoopShakeDelay: number;
  inputRange: number[];
  scale: number[];
  translateX: number[];
  translateY: number[];
};

type FreeThrowPhysicsConfig = {
  ballRadius: number;
  missRatio?: number;
  outcome: FreeThrowPhysicsOutcome;
};

type ShotPreset = {
  gravityForceScale: number;
  gravityPixels: number;
  velocityX: number;
  velocityY: number;
  totalDuration: number;
};

const PHYSICS_TIMESTEP_MS = 1000 / 120;
const APEX_BALL_SCALE = 0.8;
const FRONT_BALL_VISIBLE_OPACITY_AFTER_APEX = 0.35;
const CLOSE_MISS_COLLISION_THRESHOLD = 0.28;
const COLLISION_CATEGORY_BALL = 0x0001;
const COLLISION_CATEGORY_GOAL = 0x0002;
const COLLISION_CATEGORY_SENSOR = 0x0004;
const GOAL_COLLISION_ENABLE_Y = -330;
const MISS_BOUNCE_VELOCITY = {
  overPower: {
    x: 3.4,
    y: -4.8,
  },
  underPower: {
    x: -2.4,
    y: -3.6,
  },
} as const;

const SHOT_PRESETS: Record<FreeThrowPhysicsOutcome, ShotPreset> = {
  overPower: {
    gravityForceScale: 0.00000115,
    gravityPixels: 1550,
    velocityX: 1.45,
    velocityY: -21,
    totalDuration: 1.0,
  },
  success: {
    gravityForceScale: 0.0000013,
    gravityPixels: 1480,
    velocityX: 0,
    velocityY: -20,
    totalDuration: 1.35,
  },
  underPower: {
    gravityForceScale: 0.00000125,
    gravityPixels: 1460,
    velocityX: -1,
    velocityY: -13,
    totalDuration: 0.9,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const interpolate = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const getShotPreset = (
  outcome: FreeThrowPhysicsOutcome,
  missRatio = 0,
): ShotPreset => {
  if (outcome === "success") {
    return SHOT_PRESETS.success;
  }

  const missProgress = clamp(missRatio, 0, 1);
  const closeProgress = 1 - missProgress;

  if (outcome === "underPower") {
    return {
      gravityForceScale: interpolate(0.00000125, 0.0000013, closeProgress),
      gravityPixels: interpolate(1460, 1480, closeProgress),
      totalDuration: interpolate(0.82, 1.18, closeProgress),
      velocityX: interpolate(-1.25, -0.16, closeProgress),
      velocityY: interpolate(-12.2, -18.2, closeProgress),
    };
  }

  return {
    gravityForceScale: interpolate(0.00000115, 0.00000128, closeProgress),
    gravityPixels: interpolate(1550, 1480, closeProgress),
    totalDuration: interpolate(1.02, 1.24, closeProgress),
    velocityX: interpolate(2.15, 0.18, closeProgress),
    velocityY: interpolate(-21.8, -19.2, closeProgress),
  };
};

const createShotBodies = (ballRadius: number, shouldCollideWithGoal: boolean) => {
  const engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: {
      scale: 0,
      x: 0,
      y: 0,
    },
  });
  const ball = Matter.Bodies.circle(0, 0, ballRadius, {
    collisionFilter: {
      category: COLLISION_CATEGORY_BALL,
      mask: COLLISION_CATEGORY_SENSOR,
    },
    frictionAir: 0,
    inertia: Infinity,
    restitution: 0.64,
  });
  const leftRim = Matter.Bodies.circle(-44, -265, 8, {
    collisionFilter: {
      category: COLLISION_CATEGORY_GOAL,
      mask: COLLISION_CATEGORY_BALL,
    },
    isSensor: true,
    isStatic: true,
  });
  const rightRim = Matter.Bodies.circle(44, -265, 8, {
    collisionFilter: {
      category: COLLISION_CATEGORY_GOAL,
      mask: COLLISION_CATEGORY_BALL,
    },
    isSensor: true,
    isStatic: true,
  });
  const backboard = Matter.Bodies.rectangle(0, -340, 150, 10, {
    collisionFilter: {
      category: COLLISION_CATEGORY_GOAL,
      mask: COLLISION_CATEGORY_BALL,
    },
    isSensor: true,
    isStatic: true,
  });
  const scoreSensor = Matter.Bodies.rectangle(0, -225, 74, 18, {
    collisionFilter: {
      category: COLLISION_CATEGORY_SENSOR,
      mask: COLLISION_CATEGORY_BALL,
    },
    isSensor: true,
    isStatic: true,
  });

  Matter.Composite.add(engine.world, [
    ball,
    leftRim,
    rightRim,
    backboard,
    scoreSensor,
  ]);

  return {
    backboard,
    ball,
    engine,
    leftRim,
    rightRim,
    scoreSensor,
  };
};

const pushFrame = (
  frames: FreeThrowShotFrame[],
  ball: Matter.Body,
  time: number,
) => {
  frames.push({
    angle: ball.angle,
    behindOpacity: 0,
    frontOpacity: 1,
    scale: 1,
    time,
    x: ball.position.x,
    y: ball.position.y,
  });
};

const applyScaleByApexDepth = (frames: FreeThrowShotFrame[]) => {
  const apexDepth = Math.max(
    ...frames.map((frame) => Math.max(-frame.y, 0)),
    1,
  );

  frames.forEach((frame) => {
    const depthProgress = Math.min(Math.max(-frame.y / apexDepth, 0), 1);

    frame.scale = 1 - (1 - APEX_BALL_SCALE) * depthProgress;
  });
};

const applyScaleByProgress = (frames: FreeThrowShotFrame[]) => {
  const lastFrameTime = frames[frames.length - 1]?.time ?? 1;

  frames.forEach((frame) => {
    const progress =
      lastFrameTime <= 0
        ? 1
        : Math.min(Math.max(frame.time / lastFrameTime, 0), 1);

    frame.scale = 1 - (1 - APEX_BALL_SCALE) * progress;
  });
};

const applyScaleByGoalHeight = (frames: FreeThrowShotFrame[]) => {
  const targetDepth = Math.max(-GOAL_COLLISION_ENABLE_Y, 1);

  frames.forEach((frame) => {
    const heightProgress = Math.min(Math.max(-frame.y / targetDepth, 0), 1);

    frame.scale = 1 - (1 - APEX_BALL_SCALE) * heightProgress;
  });
};

const applySuccessDepthSwitchAfterApex = (frames: FreeThrowShotFrame[]) => {
  const apexIndex = frames.reduce(
    (bestFrameIndex, frame, frameIndex) =>
      frame.y < frames[bestFrameIndex].y ? frameIndex : bestFrameIndex,
    0,
  );

  frames.forEach((frame, frameIndex) => {
    const isBehindHoop = frameIndex > apexIndex;

    frame.behindOpacity = isBehindHoop ? 1 : 0;
    frame.frontOpacity = isBehindHoop
      ? FRONT_BALL_VISIBLE_OPACITY_AFTER_APEX
      : 1;
  });
};

const normalizeFrames = (
  frames: readonly FreeThrowShotFrame[],
  duration: number,
  hoopShakeDelay: number,
  collisionEvents: readonly FreeThrowCollisionEvent[],
): FreeThrowShotSimulation => ({
  behindOpacity: frames.map((frame) => frame.behindOpacity),
  collisionEvents: [...collisionEvents],
  didScore: collisionEvents.some((event) => event.kind === "score"),
  duration: duration * 1000,
  frontOpacity: frames.map((frame) => frame.frontOpacity),
  hoopShakeDelay,
  inputRange: frames.map((frame) =>
    duration <= 0 ? 1 : Math.min(frame.time / duration, 1),
  ),
  scale: frames.map((frame) => frame.scale),
  translateX: frames.map((frame) => frame.x),
  translateY: frames.map((frame) => frame.y),
});

export const simulateFreeThrowShot = ({
  ballRadius,
  missRatio,
  outcome,
}: FreeThrowPhysicsConfig): FreeThrowShotSimulation => {
  const normalizedMissRatio = clamp(missRatio ?? 0, 0, 1);
  const preset = getShotPreset(outcome, normalizedMissRatio);
  const shouldCollideWithGoal =
    outcome !== "success" &&
    normalizedMissRatio <= CLOSE_MISS_COLLISION_THRESHOLD;
  const { backboard, ball, engine, leftRim, rightRim, scoreSensor } =
    createShotBodies(ballRadius, shouldCollideWithGoal);
  const frames: FreeThrowShotFrame[] = [];
  const collisionEvents: FreeThrowCollisionEvent[] = [];
  let elapsedMs = 0;
  let hasPassedApex = false;
  let hasEnabledGoalCollision = !shouldCollideWithGoal;
  let hasResolvedGoalCollision = false;
  let scoreSensorHitTime: number | null = null;

  Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const otherBody =
        pair.bodyA === ball
          ? pair.bodyB
          : pair.bodyB === ball
            ? pair.bodyA
            : null;

      if (!otherBody) {
        return;
      }

      const hitTime = elapsedMs / 1000;

      if (otherBody === scoreSensor) {
        if (scoreSensorHitTime !== null || ball.velocity.y <= 0) {
          return;
        }

        scoreSensorHitTime = hitTime;
        collisionEvents.push({
          kind: "score",
          time: hitTime,
          x: ball.position.x,
          y: ball.position.y,
        });
        return;
      }

      if (otherBody === leftRim || otherBody === rightRim) {
        collisionEvents.push({
          kind: "rim",
          time: hitTime,
          x: ball.position.x,
          y: ball.position.y,
        });

        if (shouldCollideWithGoal && !hasResolvedGoalCollision) {
          const bounceVelocity = MISS_BOUNCE_VELOCITY[outcome];

          Matter.Body.setVelocity(ball, bounceVelocity);
          ball.collisionFilter.mask = 0;
          hasResolvedGoalCollision = true;
        }

        return;
      }

      if (otherBody === backboard) {
        collisionEvents.push({
          kind: "backboard",
          time: hitTime,
          x: ball.position.x,
          y: ball.position.y,
        });

        if (shouldCollideWithGoal && !hasResolvedGoalCollision) {
          const bounceVelocity = MISS_BOUNCE_VELOCITY[outcome];

          Matter.Body.setVelocity(ball, bounceVelocity);
          ball.collisionFilter.mask = 0;
          hasResolvedGoalCollision = true;
        }
      }
    });
  });

  Matter.Body.setVelocity(ball, {
    x: preset.velocityX,
    y: preset.velocityY,
  });
  pushFrame(frames, ball, 0);

  while (elapsedMs < preset.totalDuration * 1000) {
    elapsedMs += PHYSICS_TIMESTEP_MS;
    Matter.Body.applyForce(ball, ball.position, {
      x: 0,
      y: preset.gravityPixels * ball.mass * preset.gravityForceScale,
    });

    if (!hasPassedApex && ball.velocity.y > 0) {
      hasPassedApex = true;
    }

    if (
      shouldCollideWithGoal &&
      hasPassedApex &&
      ball.position.y >= GOAL_COLLISION_ENABLE_Y &&
      !hasEnabledGoalCollision
    ) {
      ball.collisionFilter.mask =
        COLLISION_CATEGORY_SENSOR | COLLISION_CATEGORY_GOAL;
      hasEnabledGoalCollision = true;
    }

    Matter.Engine.update(engine, PHYSICS_TIMESTEP_MS);
    pushFrame(frames, ball, elapsedMs / 1000);
  }

  if (outcome === "success") {
    applyScaleByApexDepth(frames);
  }

  if (outcome === "overPower") {
    applyScaleByProgress(frames);
  }

  if (outcome === "underPower") {
    applyScaleByGoalHeight(frames);
  }

  if (outcome === "success") {
    applySuccessDepthSwitchAfterApex(frames);
  }

  return normalizeFrames(
    frames,
    preset.totalDuration,
    (scoreSensorHitTime ?? preset.totalDuration * 0.78) * 1000,
    collisionEvents,
  );
};
