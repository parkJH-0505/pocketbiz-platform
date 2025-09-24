/**
 * PhaseTransitionManager
 *
 * Sprint 4 - Step 4.1: Central manager for phase transition orchestration.
 * Provides milestone tracking, blueprint definitions, and integration hooks
 * for higher-level engines and UI layers.
 */

import { serviceRegistry } from '../services/ServiceRegistry';
import { logger } from '../logging/Logger';
import type { ProjectPhase } from '../../types/buildup.types';
import type {
  PhaseTransitionRule,
  PhaseTransitionTrigger
} from '../../types/phaseTransition.types';

type MilestoneOwner =
  | 'pm'
  | 'designer'
  | 'engineer'
  | 'qa'
  | 'client'
  | 'ops'
  | 'analyst';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface PhaseMilestoneDefinition {
  id: string;
  title: string;
  description: string;
  owner: MilestoneOwner;
  required: boolean;
  successCriteria: string[];
  dueInDays?: number;
  autoTransition?: boolean;
  tags?: string[];
}

export interface PhaseDefinition {
  phase: ProjectPhase;
  label: string;
  description: string;
  expectedDurationDays: number;
  entryCriteria: string[];
  exitCriteria: string[];
  owner: MilestoneOwner;
  milestones: PhaseMilestoneDefinition[];
}

export interface PhaseMilestoneState {
  milestoneId: string;
  status: MilestoneStatus;
  updatedAt: Date;
  completedAt?: Date;
  updatedBy?: string;
  notes?: string;
}

export interface PhaseTransitionHistoryEntry {
  from: ProjectPhase;
  to: ProjectPhase;
  changedAt: Date;
  reason?: string;
  triggeredBy: string;
  trigger: PhaseTransitionTrigger;
}

export interface ProjectPhaseState {
  projectId: string;
  currentPhase: ProjectPhase;
  previousPhase?: ProjectPhase;
  startedAt: Date;
  updatedAt: Date;
  milestoneProgress: Record<string, PhaseMilestoneState>;
  transitionHistory: PhaseTransitionHistoryEntry[];
}

export interface ProjectPhaseSummary {
  projectId: string;
  currentPhase: ProjectPhase;
  previousPhase?: ProjectPhase;
  completedMilestones: number;
  totalMilestones: number;
  completionRate: number;
  lastUpdatedAt: Date;
}

type PhaseTransitionManagerEvent =
  | {
      type: 'PROJECT_REGISTERED';
      payload: { projectId: string; phase: ProjectPhase };
    }
  | {
      type: 'PHASE_CHANGED';
      payload: {
        projectId: string;
        from: ProjectPhase;
        to: ProjectPhase;
        reason?: string;
        triggeredBy: string;
        trigger: PhaseTransitionTrigger;
      };
    }
  | {
      type: 'MILESTONE_UPDATED';
      payload: {
        projectId: string;
        milestoneId: string;
        status: MilestoneStatus;
        updatedBy?: string;
      };
    };

type EventListener<T extends PhaseTransitionManagerEvent['type']> = (
  event: Extract<PhaseTransitionManagerEvent, { type: T }>
) => void;

const COMPONENT = 'PhaseTransitionManager';

const PHASE_BLUEPRINT: Readonly<Record<ProjectPhase, PhaseDefinition>> =
  Object.freeze({
    contract_pending: {
      phase: 'contract_pending',
      label: 'Contract Pending',
      description:
        'Awaiting contract confirmation, internal approvals, and initial payment.',
      expectedDurationDays: 5,
      entryCriteria: ['Lead qualified', 'Proposal delivered'],
      exitCriteria: [
        'Contract signed by both parties',
        'Initial payment confirmed'
      ],
      owner: 'pm',
      milestones: [
        {
          id: 'contract.offer_shared',
          title: 'Proposal shared',
          description:
            'Proposal and commercial offer delivered to the client with scope confirmation.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Proposal document uploaded',
            'Commercial terms approved internally'
          ],
          dueInDays: 2,
          tags: ['sales', 'documentation']
        },
        {
          id: 'contract.internal_alignment',
          title: 'Internal alignment',
          description:
            'Core team reviews feasibility, budget, and resource availability.',
          owner: 'analyst',
          required: true,
          successCriteria: [
            'Feasibility checklist completed',
            'Resource allocation draft prepared'
          ],
          dueInDays: 3,
          tags: ['operations']
        },
        {
          id: 'contract.invoice_sent',
          title: 'Invoice sent',
          description:
            'Initial invoice or payment link issued to the client with clear due date.',
          owner: 'ops',
          required: true,
          successCriteria: [
            'Invoice document stored',
            'Payment due date communicated'
          ],
          dueInDays: 1,
          tags: ['finance']
        }
      ]
    },
    contract_signed: {
      phase: 'contract_signed',
      label: 'Contract Signed',
      description:
        'Contract executed and kickoff logistics prepared before discovery work begins.',
      expectedDurationDays: 7,
      entryCriteria: [
        'Signed contract received',
        'Initial payment verified'
      ],
      exitCriteria: [
        'Kickoff meeting scheduled',
        'Project workspace prepared'
      ],
      owner: 'pm',
      milestones: [
        {
          id: 'kickoff.payment_confirmed',
          title: 'Payment confirmed',
          description: 'Finance confirms receipt of the upfront payment.',
          owner: 'ops',
          required: true,
          successCriteria: ['Finance approval logged', 'Receipt shared'],
          dueInDays: 2,
          tags: ['finance'],
          autoTransition: true
        },
        {
          id: 'kickoff.schedule',
          title: 'Kickoff scheduled',
          description:
            'Kickoff meeting scheduled with stakeholders and calendar invitation sent.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Kickoff agenda drafted',
            'Calendar invitation accepted by stakeholders'
          ],
          dueInDays: 3,
          tags: ['meeting']
        },
        {
          id: 'kickoff.workspace_ready',
          title: 'Workspace ready',
          description:
            'Shared storage, collaboration tools, and project templates prepared.',
          owner: 'ops',
          required: false,
          successCriteria: [
            'Shared drive created',
            'Access granted to core team'
          ],
          dueInDays: 5,
          tags: ['operations', 'collaboration']
        }
      ]
    },
    planning: {
      phase: 'planning',
      label: 'Planning',
      description:
        'Discovery sessions and requirement workshops to establish project scope.',
      expectedDurationDays: 10,
      entryCriteria: ['Kickoff completed', 'Discovery plan approved'],
      exitCriteria: [
        'Requirements documented',
        'Roadmap approved by stakeholders'
      ],
      owner: 'pm',
      milestones: [
        {
          id: 'planning.discovery_workshop',
          title: 'Discovery workshop',
          description:
            'Hold structured discovery session to capture current state and goals.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Workshop minutes documented',
            'Stakeholder alignment confirmed'
          ],
          dueInDays: 4,
          tags: ['facilitation']
        },
        {
          id: 'planning.requirements_signoff',
          title: 'Requirements sign-off',
          description:
            'Consolidate requirements into a single backlog and secure client approval.',
          owner: 'analyst',
          required: true,
          successCriteria: [
            'Backlog created in tracking tool',
            'Client sign-off recorded'
          ],
          dueInDays: 6,
          tags: ['analysis', 'documentation']
        },
        {
          id: 'planning.roadmap_published',
          title: 'Roadmap published',
          description:
            'Publish delivery roadmap with milestones, resources, and key dates.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Roadmap shared with stakeholders',
            'Risks and assumptions documented'
          ],
          dueInDays: 8,
          tags: ['planning']
        }
      ]
    },
    design: {
      phase: 'design',
      label: 'Design',
      description:
        'Translate requirements into tangible design assets and validation artifacts.',
      expectedDurationDays: 14,
      entryCriteria: [
        'Approved requirements backlog',
        'Design resources allocated'
      ],
      exitCriteria: [
        'Design assets approved',
        'Prototype validated with stakeholders'
      ],
      owner: 'designer',
      milestones: [
        {
          id: 'design.wireframes_complete',
          title: 'Wireframes complete',
          description:
            'Create core wireframes covering primary user flows for review.',
          owner: 'designer',
          required: true,
          successCriteria: [
            'Wireframes uploaded to design tool',
            'Internal design review completed'
          ],
          dueInDays: 5,
          tags: ['ux']
        },
        {
          id: 'design.styleguide_ready',
          title: 'Visual style defined',
          description:
            'Establish visual language, typography, and component patterns.',
          owner: 'designer',
          required: false,
          successCriteria: [
            'Style guide published',
            'Accessibility checklist completed'
          ],
          dueInDays: 7,
          tags: ['ui', 'accessibility']
        },
        {
          id: 'design.prototype_review',
          title: 'Prototype review',
          description:
            'Clickable prototype prepared and validated with stakeholders.',
          owner: 'designer',
          required: true,
          successCriteria: [
            'Prototype link shared',
            'Feedback captured and logged'
          ],
          dueInDays: 10,
          tags: ['validation']
        }
      ]
    },
    execution: {
      phase: 'execution',
      label: 'Execution',
      description:
        'Build phase where engineering teams implement features according to plan.',
      expectedDurationDays: 30,
      entryCriteria: [
        'Design assets approved',
        'Sprint plan validated'
      ],
      exitCriteria: [
        'Core features implemented',
        'QA sign-off achieved'
      ],
      owner: 'engineer',
      milestones: [
        {
          id: 'execution.sprint_plan_ready',
          title: 'Sprint plan ready',
          description:
            'Create sprint schedule with backlog items, estimates, and owners.',
          owner: 'engineer',
          required: true,
          successCriteria: [
            'Sprint backlog finalized',
            'Velocity forecast updated'
          ],
          dueInDays: 3,
          tags: ['agile']
        },
        {
          id: 'execution.dev_environment',
          title: 'Development environment ready',
          description:
            'Ensure environments, integrations, and pipelines are fully operational.',
          owner: 'engineer',
          required: true,
          successCriteria: [
            'CI pipeline green',
            'Environment health checks passed'
          ],
          dueInDays: 5,
          tags: ['devops']
        },
        {
          id: 'execution.qa_plan',
          title: 'QA plan defined',
          description:
            'Create test plan covering regression, acceptance, and automation scope.',
          owner: 'qa',
          required: false,
          successCriteria: [
            'Test cases documented',
            'Automation coverage targets agreed'
          ],
          dueInDays: 7,
          tags: ['quality']
        }
      ]
    },
    review: {
      phase: 'review',
      label: 'Review',
      description:
        'Validation phase covering QA, UAT, and operational readiness for launch.',
      expectedDurationDays: 12,
      entryCriteria: [
        'Feature development completed',
        'QA exit report available'
      ],
      exitCriteria: [
        'UAT completed',
        'Launch checklist signed off'
      ],
      owner: 'qa',
      milestones: [
        {
          id: 'review.uat_session',
          title: 'UAT session completed',
          description:
            'Conduct user acceptance testing session and capture feedback resolution.',
          owner: 'qa',
          required: true,
          successCriteria: [
            'UAT feedback logged',
            'Blocking issues resolved'
          ],
          dueInDays: 5,
          tags: ['uat']
        },
        {
          id: 'review.launch_checklist',
          title: 'Launch readiness checklist',
          description:
            'Finalize go-live checklist covering monitoring, rollback, and support.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Launch checklist approved',
            'Support rota confirmed'
          ],
          dueInDays: 7,
          tags: ['operations']
        },
        {
          id: 'review.retrospective',
          title: 'Retrospective prepared',
          description:
            'Collect metrics and insights for post-launch review and improvements.',
          owner: 'pm',
          required: false,
          successCriteria: [
            'Retrospective agenda drafted',
            'Key learnings captured'
          ],
          dueInDays: 10,
          tags: ['continuous-improvement']
        }
      ]
    },
    completed: {
      phase: 'completed',
      label: 'Completed',
      description:
        'Project delivered, handover executed, and support commitments tracked.',
      expectedDurationDays: 7,
      entryCriteria: [
        'Launch completed',
        'Client acceptance recorded'
      ],
      exitCriteria: [
        'Handover package approved',
        'Support plan activated'
      ],
      owner: 'pm',
      milestones: [
        {
          id: 'completed.delivery_package',
          title: 'Delivery package shared',
          description:
            'Compile deliverables, documents, and access credentials for the client.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Final deliverables archived',
            'Client access verified'
          ],
          dueInDays: 2,
          tags: ['handover']
        },
        {
          id: 'completed.client_signoff',
          title: 'Client sign-off recorded',
          description:
            'Capture final sign-off from client stakeholders and close outstanding items.',
          owner: 'pm',
          required: true,
          successCriteria: [
            'Sign-off document stored',
            'Outstanding issues closed'
          ],
          dueInDays: 4,
          tags: ['closure']
        },
        {
          id: 'completed.support_handover',
          title: 'Support handover completed',
          description:
            'Transition maintenance tasks to support or operations team with clear SLA.',
          owner: 'ops',
          required: false,
          successCriteria: [
            'Support channels communicated',
            'Warranty period confirmed'
          ],
          dueInDays: 7,
          tags: ['support']
        }
      ]
    }
  });

const DEFAULT_TRANSITION_RULES: ReadonlyArray<PhaseTransitionRule> = [
  {
    id: 'rule.contract_signed',
    name: 'Contract execution',
    description: 'Automatically transition when payment is confirmed.',
    fromPhase: 'contract_pending',
    toPhase: 'contract_signed',
    trigger: 'payment_completed',
    conditions: ['Invoice paid'],
    autoApply: true,
    requiresApproval: false
  },
  {
    id: 'rule.planning_start',
    name: 'Planning kickoff',
    description: 'Move to planning after kickoff meeting finishes.',
    fromPhase: 'contract_signed',
    toPhase: 'planning',
    trigger: 'meeting_completed',
    conditions: ['Kickoff meeting completed'],
    autoApply: true,
    requiresApproval: false
  },
  {
    id: 'rule.design_start',
    name: 'Design readiness',
    description: 'Transition to design once requirements are approved.',
    fromPhase: 'planning',
    toPhase: 'design',
    trigger: 'document_submitted',
    conditions: ['Requirements document signed'],
    autoApply: true,
    requiresApproval: false
  },
  {
    id: 'rule.execution_start',
    name: 'Execution start',
    description: 'Manual approval required before build begins.',
    fromPhase: 'design',
    toPhase: 'execution',
    trigger: 'manual',
    conditions: ['Prototype approved', 'Sprint plan confirmed'],
    autoApply: false,
    requiresApproval: true
  },
  {
    id: 'rule.review_start',
    name: 'Quality review',
    description: 'Shift to review after engineering completes implementation.',
    fromPhase: 'execution',
    toPhase: 'review',
    trigger: 'system',
    conditions: ['QA entry criteria met'],
    autoApply: true,
    requiresApproval: false
  },
  {
    id: 'rule.project_completion',
    name: 'Project completion',
    description: 'Manual confirmation to close the project.',
    fromPhase: 'review',
    toPhase: 'completed',
    trigger: 'manual',
    conditions: ['UAT approved', 'Launch checklist signed'],
    autoApply: false,
    requiresApproval: true
  }
];

export class PhaseTransitionManager {
  private static instance: PhaseTransitionManager | null = null;

  private readonly phaseBlueprint = PHASE_BLUEPRINT;
  private readonly transitionRules = [...DEFAULT_TRANSITION_RULES];
  private readonly projectStates = new Map<string, ProjectPhaseState>();
  private readonly listeners = new Map<
    PhaseTransitionManagerEvent['type'],
    Set<EventListener<any>>
  >();

  private constructor() {
    this.registerService();
    logger.info(
      'PhaseTransitionManager initialized',
      { phases: Object.keys(this.phaseBlueprint) },
      COMPONENT
    );
  }

  public static getInstance(): PhaseTransitionManager {
    if (!PhaseTransitionManager.instance) {
      PhaseTransitionManager.instance = new PhaseTransitionManager();
    }
    return PhaseTransitionManager.instance;
  }

  public initializeProject(
    projectId: string,
    initialPhase: ProjectPhase = 'contract_pending'
  ): ProjectPhaseState {
    if (this.projectStates.has(projectId)) {
      return this.cloneState(this.projectStates.get(projectId)!);
    }

    const state = this.createInitialState(projectId, initialPhase);
    this.projectStates.set(projectId, state);

    this.emit({
      type: 'PROJECT_REGISTERED',
      payload: { projectId, phase: initialPhase }
    });

    logger.info(
      'Project registered in phase manager',
      { projectId, phase: initialPhase },
      COMPONENT
    );

    return this.cloneState(state);
  }

  public getProjectState(projectId: string): ProjectPhaseState | null {
    const state = this.projectStates.get(projectId);
    return state ? this.cloneState(state) : null;
  }

  public getProjectSummary(projectId: string): ProjectPhaseSummary | null {
    const state = this.projectStates.get(projectId);
    if (!state) return null;

    const milestones = Object.values(state.milestoneProgress);
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(
      milestone => milestone.status === 'completed'
    ).length;

    const completionRate =
      totalMilestones === 0
        ? 0
        : Math.round((completedMilestones / totalMilestones) * 100);

    return {
      projectId: state.projectId,
      currentPhase: state.currentPhase,
      previousPhase: state.previousPhase,
      completedMilestones,
      totalMilestones,
      completionRate,
      lastUpdatedAt: new Date(state.updatedAt)
    };
  }

  public updateMilestoneStatus(
    projectId: string,
    milestoneId: string,
    status: MilestoneStatus,
    options: { updatedBy?: string; notes?: string } = {}
  ): PhaseMilestoneState {
    const state = this.projectStates.get(projectId);
    if (!state) {
      throw new Error(`Project ${projectId} is not registered in the manager.`);
    }

    const milestoneState = state.milestoneProgress[milestoneId];
    if (!milestoneState) {
      throw new Error(
        `Milestone ${milestoneId} is not defined for phase ${state.currentPhase}.`
      );
    }

    const now = new Date();
    milestoneState.status = status;
    milestoneState.updatedAt = now;
    milestoneState.updatedBy = options.updatedBy;

    if (options.notes !== undefined) {
      milestoneState.notes = options.notes;
    }

    if (status === 'completed') {
      milestoneState.completedAt = now;
    } else {
      milestoneState.completedAt = undefined;
    }

    state.updatedAt = now;

    this.emit({
      type: 'MILESTONE_UPDATED',
      payload: {
        projectId,
        milestoneId,
        status,
        updatedBy: options.updatedBy
      }
    });

    logger.debug(
      'Milestone status updated',
      {
        projectId,
        milestoneId,
        status,
        phase: state.currentPhase,
        updatedBy: options.updatedBy
      },
      COMPONENT
    );

    return { ...milestoneState };
  }

  public changePhase(
    projectId: string,
    targetPhase: ProjectPhase,
    options: {
      reason?: string;
      trigger?: PhaseTransitionTrigger;
      triggeredBy?: string;
    } = {}
  ): ProjectPhaseState {
    const state = this.projectStates.get(projectId);
    if (!state) {
      throw new Error(`Project ${projectId} is not registered in the manager.`);
    }

    if (!this.phaseBlueprint[targetPhase]) {
      throw new Error(`Unknown phase: ${targetPhase}`);
    }

    if (state.currentPhase === targetPhase) {
      return this.cloneState(state);
    }

    const now = new Date();
    const previousPhase = state.currentPhase;
    const trigger = options.trigger ?? 'system';
    const triggeredBy = options.triggeredBy ?? 'system';

    state.previousPhase = previousPhase;
    state.currentPhase = targetPhase;
    state.startedAt = now;
    state.updatedAt = now;
    state.milestoneProgress = this.createMilestoneProgress(targetPhase, now);
    state.transitionHistory.push({
      from: previousPhase,
      to: targetPhase,
      changedAt: now,
      reason: options.reason,
      triggeredBy,
      trigger
    });

    this.emit({
      type: 'PHASE_CHANGED',
      payload: {
        projectId,
        from: previousPhase,
        to: targetPhase,
        reason: options.reason,
        triggeredBy,
        trigger
      }
    });

    logger.info(
      'Project phase changed',
      {
        projectId,
        from: previousPhase,
        to: targetPhase,
        reason: options.reason,
        trigger,
        triggeredBy
      },
      COMPONENT
    );

    return this.cloneState(state);
  }

  public getPhaseDefinition(phase: ProjectPhase): PhaseDefinition {
    const definition = this.phaseBlueprint[phase];
    if (!definition) {
      throw new Error(`Unknown phase: ${phase}`);
    }

    return {
      ...definition,
      milestones: definition.milestones.map(milestone => ({ ...milestone }))
    };
  }

  public listPhaseDefinitions(): PhaseDefinition[] {
    return Object.values(this.phaseBlueprint).map(definition => ({
      ...definition,
      milestones: definition.milestones.map(milestone => ({ ...milestone }))
    }));
  }

  public getTransitionRules(): PhaseTransitionRule[] {
    return this.transitionRules.map(rule => ({ ...rule }));
  }

  public on<T extends PhaseTransitionManagerEvent['type']>(
    type: T,
    handler: EventListener<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const handlers = this.listeners.get(type)!;
    handlers.add(handler as EventListener<any>);

    return () => {
      const currentHandlers = this.listeners.get(type);
      if (!currentHandlers) return;
      currentHandlers.delete(handler as EventListener<any>);
      if (currentHandlers.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  public resetProject(projectId: string): void {
    if (this.projectStates.delete(projectId)) {
      logger.warn(
        'Project state removed from phase manager',
        { projectId },
        COMPONENT
      );
    }
  }

  public resetAll(): void {
    this.projectStates.clear();
    logger.warn('All project states cleared in phase manager', {}, COMPONENT);
  }

  public getRegisteredProjectIds(): string[] {
    return Array.from(this.projectStates.keys());
  }

  private createInitialState(
    projectId: string,
    phase: ProjectPhase
  ): ProjectPhaseState {
    const now = new Date();
    return {
      projectId,
      currentPhase: phase,
      previousPhase: undefined,
      startedAt: now,
      updatedAt: now,
      milestoneProgress: this.createMilestoneProgress(phase, now),
      transitionHistory: []
    };
  }

  private createMilestoneProgress(
    phase: ProjectPhase,
    timestamp: Date
  ): Record<string, PhaseMilestoneState> {
    const definition = this.phaseBlueprint[phase];
    if (!definition) {
      throw new Error(`Unknown phase: ${phase}`);
    }

    const progress: Record<string, PhaseMilestoneState> = {};
    definition.milestones.forEach(milestone => {
      progress[milestone.id] = {
        milestoneId: milestone.id,
        status: 'pending',
        updatedAt: new Date(timestamp)
      };
    });

    return progress;
  }

  private cloneState(state: ProjectPhaseState): ProjectPhaseState {
    return {
      projectId: state.projectId,
      currentPhase: state.currentPhase,
      previousPhase: state.previousPhase,
      startedAt: new Date(state.startedAt),
      updatedAt: new Date(state.updatedAt),
      milestoneProgress: Object.fromEntries(
        Object.entries(state.milestoneProgress).map(([id, progress]) => [
          id,
          {
            milestoneId: progress.milestoneId,
            status: progress.status,
            updatedAt: new Date(progress.updatedAt),
            completedAt: progress.completedAt
              ? new Date(progress.completedAt)
              : undefined,
            updatedBy: progress.updatedBy,
            notes: progress.notes
          }
        ])
      ),
      transitionHistory: state.transitionHistory.map(entry => ({
        from: entry.from,
        to: entry.to,
        changedAt: new Date(entry.changedAt),
        reason: entry.reason,
        triggeredBy: entry.triggeredBy,
        trigger: entry.trigger
      }))
    };
  }

  private emit(event: PhaseTransitionManagerEvent): void {
    const handlers = this.listeners.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    handlers.forEach(handler => {
      try {
        handler(event as never);
      } catch (error) {
        logger.error(
          'Error while executing phase manager listener',
          error,
          COMPONENT
        );
      }
    });
  }

  private registerService(): void {
    try {
      serviceRegistry.register(
        'phaseTransitionManager',
        () => this,
        {
          name: 'phaseTransitionManager',
          version: '1.0.0',
          dependencies: ['phaseTransitionModule'],
          singleton: true,
          lazy: false,
          description: 'Central coordinator for phase transition blueprint and state'
        }
      );
    } catch (error) {
      logger.warn(
        'PhaseTransitionManager service registration skipped',
        error,
        COMPONENT
      );
    }
  }
}

export const phaseTransitionManager = PhaseTransitionManager.getInstance();
