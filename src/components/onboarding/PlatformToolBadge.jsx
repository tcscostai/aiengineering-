import { getPlatformTool } from '../../data/platformTools'

function resolvePlatform(platformTool, runtimeType) {
  if (platformTool && platformTool !== 'external') return getPlatformTool(platformTool)
  if (runtimeType === 'sel_api') return getPlatformTool('sel')
  if (runtimeType === 'ignio_api') return getPlatformTool('ignio')
  if (runtimeType === 'are_api') return getPlatformTool('are')
  return null
}

export function PlatformToolBadge({ platformTool, runtimeType, size = 'sm' }) {
  const pt = resolvePlatform(platformTool, runtimeType)
  if (!pt) return null

  const px = size === 'xs' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'

  return (
    <span
      className={`uppercase rounded font-mono font-medium ${px}`}
      style={{ backgroundColor: `${pt.color}22`, color: pt.color }}
      title={pt.fullName}
    >
      {pt.name}
    </span>
  )
}
