import axios_entity from '@/axios';
/** */
export async function EQAbnormalWhenEQBusyEmu() {
    var ret = await _axios.get('api/EQHandshakeEmu/EQAlarmWhenEQBusySimulation');
    return ret.data;
}
/** */
export async function EQInitialze() {
    var ret = await _axios.get('api/EQHandshakeEmu/EQInitialze');
    return ret.data;
}
