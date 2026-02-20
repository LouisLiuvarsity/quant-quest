/*
 * SubscriptionPanel - Free vs Pro plan comparison and upgrade
 * Shows plan features, pricing, and upgrade button
 */

import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    priceNote: '永久免费',
    features: [
      { text: '最多 3 个实盘策略', included: true },
      { text: '10,000,000 初始积分', included: true },
      { text: '基础回测引擎', included: true },
      { text: '社区排行榜', included: true },
      { text: '收益提现', included: false },
      { text: '高级回测指标', included: false },
      { text: '实盘配资', included: false },
      { text: '优先客服', included: false },
    ],
    color: 'oklch(0.5 0.02 260)',
    borderColor: 'oklch(0.3 0.03 260)',
  },
  {
    id: 'pro',
    name: 'Pro 版',
    price: '¥20',
    priceNote: '/月',
    features: [
      { text: '最多 10 个实盘策略', included: true },
      { text: '额外 500,000 积分奖励', included: true },
      { text: '高级回测引擎 + 全指标', included: true },
      { text: '社区排行榜 + 专属徽章', included: true },
      { text: '利润提现 50%-90%', included: true },
      { text: '配资 1,000 USDT', included: true },
      { text: '实盘盈利奖励积分', included: true },
      { text: '优先客服支持', included: true },
    ],
    color: 'oklch(0.82 0.15 85)',
    borderColor: 'oklch(0.82 0.15 85 / 0.5)',
  },
];

export function SubscriptionPanel() {
  const { state, upgradePlan } = useGame();

  const handleUpgrade = () => {
    if (state.plan === 'pro') {
      toast.info('你已经是 Pro 用户了！');
      return;
    }
    upgradePlan();
    toast.success('🎉 升级成功！', { description: '已解锁 Pro 版全部功能' });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Current plan */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3 text-center">
        <p className="font-pixel text-[7px] text-[oklch(0.5_0.02_260)] mb-1">当前方案</p>
        <p className="font-pixel text-sm" style={{ color: state.plan === 'pro' ? 'oklch(0.82 0.15 85)' : 'oklch(0.6 0.02 260)' }}>
          {state.plan === 'pro' ? '⭐ PRO' : '🆓 FREE'}
        </p>
      </div>

      {/* Plan comparison */}
      <div className="space-y-3">
        {PLANS.map(plan => {
          const isCurrent = state.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`border-2 p-4 transition-all ${
                isCurrent ? 'bg-[oklch(0.18_0.03_260)]' : 'bg-[oklch(0.16_0.025_260)]'
              }`}
              style={{ borderColor: isCurrent ? plan.color : plan.borderColor }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-pixel text-[10px]" style={{ color: plan.color }}>
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">✓ 当前方案</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold" style={{ color: plan.color }}>
                    {plan.price}
                  </span>
                  <span className="font-display text-xs text-[oklch(0.5_0.02_260)]">
                    {plan.priceNote}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs ${feature.included ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.35_0.02_260)]'}`}>
                      {feature.included ? '✅' : '❌'}
                    </span>
                    <span className={`font-display text-xs ${feature.included ? 'text-[oklch(0.75_0.02_260)]' : 'text-[oklch(0.35_0.02_260)] line-through'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {plan.id === 'pro' && state.plan !== 'pro' && (
                <button
                  onClick={handleUpgrade}
                  className="mt-4 w-full font-pixel text-[9px] py-3 bg-[oklch(0.82_0.15_85)] text-[oklch(0.15_0.02_85)] border-3 border-[oklch(0.65_0.15_85)] hover:bg-[oklch(0.87_0.12_85)] transition-all active:translate-y-0.5"
                  style={{
                    boxShadow: 'inset -3px -3px 0 oklch(0.6 0.15 85), inset 3px 3px 0 oklch(0.92 0.1 85), 0 0 15px oklch(0.82 0.15 85 / 0.3)',
                  }}
                >
                  ⭐ 升级至 Pro · ¥20/月
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pro benefits detail */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-2">💰 提现规则</p>
        <div className="space-y-2 font-display text-xs text-[oklch(0.6_0.02_260)]">
          <p>• Pro用户配资 1,000 USDT 进行实盘模拟</p>
          <p>• 策略盈利后可提现利润的 50%-90%</p>
          <p>• 提现比例根据策略表现和运行时长递增</p>
          <p>• 提现为真实现金，通过支付宝/微信到账</p>
          <p>• 盈利同时奖励游戏积分，用于扩展团队</p>
        </div>
      </div>
    </div>
  );
}
