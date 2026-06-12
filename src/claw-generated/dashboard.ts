import { Metrics } from './metrics';

export const clawChainDashboard = {
  title: 'ClawChain Network Health',
  panels: [
    {
      title: 'Block Production',
      type: 'graph',
      targets: [
        {
          query: 'Metrics.getBlockProduction()',
          refId: 'A'
        }
      ]
    },
    {
      title: 'Transaction Volume',
      type: 'graph',
      targets: [
        {
          query: 'Metrics.getTransactionVolume()',
          refId: 'A'
        }
      ]
    },
    {
      title: 'Node Resource Usage',
      type: 'row',
      panels: [
        {
          title: 'CPU',
          type: 'gauge',
          targets: [
            {
              query: 'Metrics.getNodeResourceUsage().cpu',
              refId: 'A'
            }
          ]
        },
        {
          title: 'Memory',
          type: 'gauge',
          targets: [
            {
              query: 'Metrics.getNodeResourceUsage().memory',
              refId: 'A'
            }
          ]
        }
      ]
    },
    {
      title: 'Validator Status',
      type: 'row',
      panels: [
        {
          title: 'Active Validators',
          type: 'gauge',
          targets: [
            {
              query: 'Metrics.getValidatorStatus().active',
              refId: 'A'
            }
          ]
        },
        {
          title: 'Inactive Validators',
          type: 'gauge',
          targets: [
            {
              query: 'Metrics.getValidatorStatus().inactive',
              refId: 'A'
            }
          ]
        },
        {
          title: 'Total Rewards',
          type: 'gauge',
          targets: [
            {
              query: 'Metrics.getValidatorStatus().rewards',
              refId: 'A'
            }
          ]
        }
      ]
    }
  ]
};