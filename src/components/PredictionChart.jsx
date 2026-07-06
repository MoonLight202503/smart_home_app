import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './PredictionChart.css'

const CHART_WIDTH = 320
const CHART_HEIGHT = 110
const PAD_LEFT = 34
const PAD_RIGHT = 34
const PAD_TOP = 10
const PAD_BOTTOM = 22

function buildPath(values, min, max) {
  const innerW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM
  const range = max - min || 1
  const step = values.length > 1 ? innerW / (values.length - 1) : 0

  return values
    .map((v, i) => {
      const x = PAD_LEFT + step * i
      const y = PAD_TOP + innerH - ((v - min) / range) * innerH
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function MiniChart({ rows, values, min, max, colorClass, labelIndexes, step }) {
  const path = buildPath(values, min, max)

  return (
    <svg
      className="prediction-svg"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {[0, 0.5, 1].map((f) => {
        const y = PAD_TOP + (CHART_HEIGHT - PAD_TOP - PAD_BOTTOM) * f
        return (
          <line
            key={f}
            x1={PAD_LEFT}
            y1={y}
            x2={CHART_WIDTH - PAD_RIGHT}
            y2={y}
            className="prediction-gridline"
          />
        )
      })}

      {labelIndexes.map((i) => {
        const x = PAD_LEFT + step * i
        const t = rows[i].predicted_time
        const hour = t ? new Date(t).getHours() : ''
        return (
          <text
            key={i}
            x={x}
            y={CHART_HEIGHT - 6}
            className="prediction-axis-label"
            textAnchor="middle"
          >
            {hour}시
          </text>
        )
      })}

      <path d={path} className={`prediction-line ${colorClass}`} />
    </svg>
  )
}

export default function PredictionChart() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('prediction')
      .select('predicted_time, pred_insolation, pred_power')
      .order('predicted_time', { ascending: true })

    if (err) {
      setError(err.message)
      setRows([])
    } else {
      setRows(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="card prediction-card">
        <h4 className="card-title">발전량 예측</h4>
        <div className="prediction-status">불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card prediction-card">
        <h4 className="card-title">발전량 예측</h4>
        <div className="prediction-status prediction-error">
          데이터를 불러오지 못했습니다: {error}
        </div>
        <button className="prediction-retry" onClick={load}>
          다시 시도
        </button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="card prediction-card">
        <h4 className="card-title">발전량 예측</h4>
        <div className="prediction-status">예측 데이터가 없습니다.</div>
      </div>
    )
  }

  const insolation = rows.map((r) => Number(r.pred_insolation) || 0)
  const power = rows.map((r) => Number(r.pred_power) || 0)

  const insolationMax = Math.max(...insolation, 1)
  const powerMin = Math.min(...power)
  const powerMax = Math.max(...power, powerMin + 1)

  const innerW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT
  const step = rows.length > 1 ? innerW / (rows.length - 1) : 0

  const labelIndexes = rows
    .map((_, i) => i)
    .filter((i) => i % 4 === 0 || i === rows.length - 1)

  const totalPower = power.reduce((a, b) => a + b, 0)
  const maxInsolation = Math.max(...insolation)

  return (
    <div className="card prediction-card">
      <div className="row space">
        <h4 className="card-title">발전량 예측 (24h)</h4>
        <button className="prediction-refresh" onClick={load} aria-label="새로고침">
          ⟳
        </button>
      </div>

      <div className="prediction-section">
        <div className="prediction-section-title">
          <span className="legend-dot insolation-dot" />
          일사량 (W/m², 최대 {maxInsolation.toFixed(2)})
        </div>
        <MiniChart
          rows={rows}
          values={insolation}
          min={0}
          max={insolationMax}
          colorClass="insolation-line"
          labelIndexes={labelIndexes}
          step={step}
        />
      </div>

      <div className="prediction-section">
        <div className="prediction-section-title">
          <span className="legend-dot power-dot" />
          발전량 (W, 합계 {totalPower.toFixed(2)})
        </div>
        <MiniChart
          rows={rows}
          values={power}
          min={powerMin}
          max={powerMax}
          colorClass="power-line"
          labelIndexes={labelIndexes}
          step={step}
        />
      </div>
    </div>
  )
}
