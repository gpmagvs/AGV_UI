import axios_entity from '@/axios'

export const SaftyPLCAPI = {
  /**
   * 設定 Safety PLC 模擬器 Result raw bit
   * @param {number} byteOffset
   * @param {number} bitInByte
   * @param {boolean} value
   * @returns {Promise<{confirm:boolean, message:string}>}
   */
  async SetSimulatorResultBit(byteOffset, bitInByte, value) {
    try {
      const ret = await axios_entity.post('api/SaftyPLC/Simulator/ResultBit', {
        ByteOffset: byteOffset,
        BitInByte: bitInByte,
        Value: value
      })
      return ret.data ?? { confirm: false, message: 'Empty response' }
    } catch (error) {
      return { confirm: false, message: error?.message || 'Network Error' }
    }
  },

  /**
   * 設定指定 Result 訊號的 ActiveHigh（寫入 SaftyPLCMap.json）
   * @param {string} signal
   * @param {boolean} activeHigh
   * @returns {Promise<{confirm:boolean, message:string}>}
   */
  async SetActiveHigh(signal, activeHigh) {
    try {
      const ret = await axios_entity.post('api/SaftyPLC/ActiveHigh', {
        Signal: signal,
        ActiveHigh: activeHigh
      })
      return ret.data ?? { confirm: false, message: 'Empty response' }
    } catch (error) {
      return { confirm: false, message: error?.message || 'Network Error' }
    }
  }
}
