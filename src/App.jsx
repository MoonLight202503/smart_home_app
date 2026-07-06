import { useState } from 'react'
import { supabase } from './supabase'
import ToggleSwitch from './components/ToggleSwitch'
import PredictionChart from './components/PredictionChart'
import './App.css'

// 아이콘
import snowIcon from './assets/snow.png'
import tempIcon from './assets/hot.png'
import coolIcon from './assets/cool.png'

export default function App() {
  const [state, setState] = useState({
    smart_light0: 0,
    smart_light1: 0,
    smart_light2: 0,
    smart_light3: 0,
    smart_light4: 0,

    airC0_mode: 'COOL',
    airC0_value: 24,
    airC1_mode: 'COOL',
    airC1_value: 24,

    is_air_Purifier0: false,
    is_air_Purifier1: false,

    is_airC0: false, 
    is_airC1: false,

    is_door: false,
    is_window: false,
    is_auto_mode: false,
  })

  // Auto Mode 켜지면 문/창문 제외 전부 비활성
  const controlDisabled = state.is_auto_mode

  // 데이터 전송 및 상태 갱신 함수
  const update = async (newState) => {
    // 1. UI용 로컬 상태 반영
    setState(newState)

    // 2. 아두이노 및 DB 전송 규격에 맞춘 데이터 가공 (dbCommand)
    const dbCommand = {
      ...newState,
      command_timestamp: new Date().toISOString()
    }

    // 아두이노의 strcmp 조건과 대소문자를 정확히 맵핑 ("Cool", "Heater")
    if (dbCommand.airC0_mode === 'COOL') dbCommand.airC0_mode = 'Cool';
    if (dbCommand.airC0_mode === 'HEATER') dbCommand.airC0_mode = 'Heater';
    
    if (dbCommand.airC1_mode === 'COOL') dbCommand.airC1_mode = 'Cool';
    if (dbCommand.airC1_mode === 'HEATER') dbCommand.airC1_mode = 'Heater';

    // 수파베이스 DB 컬럼명 대문자 'is_airC0' 그대로 전송 및 불리언 타입 안정화
    if (dbCommand.is_airC0 !== undefined) dbCommand.is_airC0 = Boolean(dbCommand.is_airC0);
    if (dbCommand.is_airC1 !== undefined) dbCommand.is_airC1 = Boolean(dbCommand.is_airC1);
    if (dbCommand.is_door !== undefined) dbCommand.is_door = Boolean(dbCommand.is_door);
    if (dbCommand.is_window !== undefined) dbCommand.is_window = Boolean(dbCommand.is_window);
    if (dbCommand.is_auto_mode !== undefined) dbCommand.is_auto_mode = Boolean(dbCommand.is_auto_mode);
    if (dbCommand.is_air_Purifier0 !== undefined) dbCommand.is_air_Purifier0 = Boolean(dbCommand.is_air_Purifier0);
    if (dbCommand.is_air_Purifier1 !== undefined) dbCommand.is_air_Purifier1 = Boolean(dbCommand.is_air_Purifier1);

    // 고유 키 에러 방지
    delete dbCommand.id;
    delete dbCommand.created_at;

    // 3. 데이터베이스로 전송
    await supabase.from('control_command').insert([dbCommand])
  }

  /* ================= LED ================= */
  const renderLight = (i) => (
    <div className="row led-row" key={i}>
      <span>LED {i}</span>
      <input
        className="full-range"
        type="range"
        min="0"
        max="255"
        value={state[`smart_light${i}`]}
        disabled={controlDisabled}
        onChange={(e) =>
          update({
            ...state,
            [`smart_light${i}`]: Number(e.target.value),
          })
        }
      />
    </div>
  )

  return (
    <div className="container">
      <h1>Smart Home</h1>

      {/* ================= Auto Mode ================= */}
      <section className="section">
        <div className="card auto-card">
          <div className="row space">
            <h4>Auto Mode</h4>
            <ToggleSwitch
              checked={state.is_auto_mode}
              onChange={(v) =>
                update({ ...state, is_auto_mode: v })
              }
            />
          </div>
        </div>
      </section>

      {/* ================= LED ================= */}
      <section className="section">
        <p className="section-label">Lighting</p>
        <div className={`card ${controlDisabled ? 'disabled' : ''}`}>
          <h4 className="card-title">Smart LED Control</h4>
          {[0, 1, 2, 3, 4].map(renderLight)}
        </div>
      </section>

      {/* ================= 🔄 Floor 2 (다시 상단으로 이동 완료) ================= */}
      <section className="section">
        <p className="section-label">Climate</p>
        <div className={`card ${controlDisabled ? 'disabled' : ''}`}>
          <h4 className="card-title">Floor 1</h4>

          <div className="row power-row">
            <div className="power-group">
              <span className="power-text">Power</span>
              <ToggleSwitch
                checked={state.is_airC1}
                onChange={(v) =>
                  update({ ...state, is_airC1: v })
                }
              />
            </div>
          </div>

          <div className="row">
            <span>Temperature</span>
          </div>

          <input
            className="full-range"
            type="range"
            min="0"
            max="40"
            step="0.1"
            value={state.airC1_value}
            onChange={(e) =>
              update({
                ...state,
                airC1_value: Number(e.target.value),
              })
            }
          />
          <div className="temp-text">{state.airC1_value} ℃</div>

          <div className="row mode-row">
            <button
              className={`mode-btn ${state.airC1_mode === 'COOL' ? 'active1' : ''}`}
              onClick={() =>
                update({ ...state, airC1_mode: 'COOL' })
              }
            >
              <img src={snowIcon} alt="cool" />
              <span>COOL</span>
            </button>

            <button
              className={`mode-btn ${state.airC1_mode === 'HEATER' ? 'active2' : ''}`}
              onClick={() =>
                update({ ...state, airC1_mode: 'HEATER' })
              }
            >
              <img src={tempIcon} alt="heater" />
              <span>HEATER</span>
            </button>
          </div>

          <div className="row space">
            <button
              className={`purifier-btn ${
                state.is_air_Purifier1 ? 'purifier-active' : ''
              }`}
              onClick={() =>
                update({
                  ...state,
                  is_air_Purifier1: !state.is_air_Purifier1,
                })
              }
            >
              <img src={coolIcon} alt="air purifier" />
              <span>Air Purifier</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 🔄 Floor 1 (다시 하단으로 이동 완료) ================= */}
      <section className="section">
        <div className={`card ${controlDisabled ? 'disabled' : ''}`}>
          <h4 className="card-title">Floor 2</h4>

          <div className="row power-row">
            <div className="power-group">
              <span className="power-text">Power</span>
              <ToggleSwitch
                checked={state.is_airC0}
                onChange={(v) =>
                  update({ ...state, is_airC0: v })
                }
              />
            </div>
          </div>

          <div className="row">
            <span>Temperature</span>
          </div>

          <input
            className="full-range"
            type="range"
            min="0"
            max="40"
            step="0.1"
            value={state.airC0_value}
            onChange={(e) =>
              update({
                ...state,
                airC0_value: Number(e.target.value),
              })
            }
          />
          <div className="temp-text">{state.airC0_value} ℃</div>

          <div className="row mode-row">
            <button
              className={`mode-btn ${state.airC0_mode === 'COOL' ? 'active1' : ''}`}
              onClick={() =>
                update({ ...state, airC0_mode: 'COOL' })
              }
            >
              <img src={snowIcon} alt="cool" />
              <span>COOL</span>
            </button>

            <button
              className={`mode-btn ${state.airC0_mode === 'HEATER' ? 'active2' : ''}`}
              onClick={() =>
                update({ ...state, airC0_mode: 'HEATER' })
              }
            >
              <img src={tempIcon} alt="heater" />
              <span>HEATER</span>
            </button>
          </div>

          <div className="row space">
            <button
              className={`purifier-btn ${
                state.is_air_Purifier0 ? 'purifier-active' : ''
              }`}
              onClick={() =>
                update({
                  ...state,
                  is_air_Purifier0: !state.is_air_Purifier0,
                })
              }
            >
              <img src={coolIcon} alt="air purifier" />
              <span>Air Purifier</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 발전량 예측 ================= */}
      <section className="section">
        <p className="section-label">Energy</p>
        <PredictionChart />
      </section>

      {/* ================= Door / Window ================= */}
      <section className="section">
        <p className="section-label">Security</p>
        <div className="card compact">
          <h4 className="card-title">Open / Lock</h4>

          <div className="row mode-row">
            <button
              className={`mode-btn ${state.is_door ? 'active1' : ''}`}
              onClick={() => update({ ...state, is_door: !state.is_door })}
            >
              🪟
              <span>Window</span>
            </button>

            <button
              className={`mode-btn ${state.is_window ? 'active1' : ''}`}
              onClick={() => update({ ...state, is_window: !state.is_window })}
            >
              🚪
              <span>Door</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}