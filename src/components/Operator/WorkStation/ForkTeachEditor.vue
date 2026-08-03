<template>
  <div>
    <el-affix :offset="40">
      <div class="d-flex fle-row border-bottom py-1 my-1 bg-light">
        <el-button type="primary" @click="SaveHandler">儲存</el-button>
        <el-button type="info" @click="AddTagTeachHandler">新增</el-button>
        <el-button type="info" @click="reload">重新載入</el-button>
        <el-button type="success" @click="TriggerTeachFileUpload">上傳檔案</el-button>
        <el-button type="danger" @click="ClearTeachDataHandler">清除資料</el-button>
        <el-button @click="() => { showOffsetDialog = true }">OFFSET</el-button>
        <input ref="teachFileInput" type="file" accept=".ini,.json" style="display: none"
          @change="HandleTeachFileSelected" />
      </div>
    </el-affix>
    <el-dialog title="OFFSET 調整" v-model="showOffsetDialog" width="30%">
      <div class="d-flex flex-row justify-content-center align-items-center gap-2">
        <span>OFFSET</span>
        <el-input-number v-model="offsetVal" size="normal" label="offsetVal" :controls="true" controls-position="both"
          @change="">
        </el-input-number>
        <el-button @click="handleModifyOffsetBtnClick">修改</el-button>
      </div>
      <template #footer>
        <span>
          <!-- <el-button @click=" = false">取消</el-button>
    <el-button type="primary" @click="">确认</el-button> -->
        </span>
      </template>
    </el-dialog>

    <div class="text-start py-1">
      <span>設備選擇:</span>
      <el-select v-model="selected_tag" @change="HandleStationSelected" class="mx-2">
        <el-option value="all" label="ALL"></el-option>
        <el-option v-for="opt in StationOptions" :key="opt.value" :value="opt.value" :label="opt.text"></el-option>
      </el-select>
    </div>
    <el-table @cell-click="HandleCellClicked" :data="TeachDatasShown" size="small" v-loading="loading"
      :row-key="(row) => row.Tag" :row-class-name="GetRowClass">
      <el-table-column label="Tag" prop="Tag" sortable>
        <template #default="scope">
          <div>
            <el-input @click="TagNumberInputClicked" @change="InputChanged" type="number"
              v-model="scope.row.Tag"></el-input>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="設備名稱" prop="Name">
        <template #default="scope">
          <div>
            <el-input disabled @change="InputChanged" v-model="scope.row.Name"></el-input>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="需交握" prop="NeedHandshake">
        <template #default="scope">
          <div>
            <el-checkbox @change="HandleNeedHandshakeCkbChanged(scope.row)"
              v-model="scope.row.NeedHandshake"></el-checkbox>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-for="index in [0, 1, 2]" :key="index" :label="'第' + (index + 1) + '層'">
        <el-table-column label="下點位(cm)" :prop="`Down_Pose:${index}`">
          <template #default="scope">
            <el-input @click="InputClicked" @change="InputChanged" type="number" step="0.01"
              v-if="scope.row.Layers[index] != undefined" v-model="scope.row.Layers[index].Value.Down_Pose"></el-input>
          </template>
        </el-table-column>
        <el-table-column label="上點位(cm)" :prop="`Up_Pose:${index}`">
          <template #default="scope">
            <el-input @click="InputClicked" @change="InputChanged" type="number" step="0.01"
              v-if="scope.row.Layers[index] != undefined" v-model="scope.row.Layers[index].Value.Up_Pose"></el-input>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column min-width="100">
        <template #default="scope">
          <div>
            <el-button @click="RemoveTagTeachSetting(scope.row)" type="danger" size="small">刪除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <TeachTool @onValueChanged="HamdleVirtualKBValuechange" ref="teach_tool"></TeachTool>
    <!-- <SimpleKeyboardVue></SimpleKeyboardVue> -->
  </div>
</template>
<script>
import { ForkAPI } from '@/api/VMSAPI'
import { ForkTeachStore } from '@/store'
import SimpleKeyboardVue from '@/components/Tools/SimpleKeyboard.vue';
import TeachTool from './ForkTeachTool.vue'
export default {
  components: {
    SimpleKeyboardVue, TeachTool
  },
  data() {
    return {
      TeachDatas: [
        {
          Tag: 10,
          Name: '',
          Layers: [
            {
              Key: 0,
              Value: {
                Name: "10-0",
                Up_Pose: 12.2,
                Down_Pose: 9
              }
            },
            {
              Key: 1,
              Value: {
                Name: "10-1",
                Up_Pose: 12.2,
                Down_Pose: 9
              }
            },

          ]
        },
        {
          Tag: 20,
          Name: '',
          Layers: [
            {
              Key: 0,
              Value: {
                Name: "20-0",
                Up_Pose: 11.2,
                Down_Pose: 1
              }
            },
            {
              Key: 1,
              Value: {
                Name: "20-1",
                Up_Pose: 33.2,
                Down_Pose: 1
              }
            },
            {
              Key: 2,
              Value: {
                Name: "20-2",
                Up_Pose: 133.2,
                Down_Pose: 1
              }
            },

          ]
        },
      ],
      OriDataJson: undefined,
      HasAnyChange: false,
      loading: false,
      selected_data: {},
      selected_tag: 'all',
      showOffsetDialog: false,
      offsetVal: 0,
      isImportingTeachData: false
    }
  },
  watch: {
    HasAnyChange(currentVal, oldValue) {
      ForkTeachStore.commit('setIsAnyChanged', currentVal)
    }
  },
  computed: {
    StationOptions() {
      return this.TeachDatas.sort(d => d.Tag).map(dat => {
        return {
          value: dat.Tag,
          text: `${dat.Tag}-${dat.Name}`
        }
      })
    },
    TeachDatasShown() {
      if (this.selected_tag == 'all')
        return this.TeachDatas;
      else
        return this.TeachDatas.filter(dt => dt.Tag == this.selected_tag)

    },
    NewTagNumber() {
      var teachDataLen = this.TeachDatas.length;
      if (teachDataLen == 0)
        return 1;

      return this.TeachDatas[teachDataLen - 1].Tag + 1;
    },
    NewTagLayerDataTemplate() {

      return [
        {
          Key: 0,
          Value: {
            Name: "1-0",
            Up_Pose: 0,
            Down_Pose: 0
          }
        },
        {
          Key: 1,
          Value: {
            Name: "1-1",
            Up_Pose: 0,
            Down_Pose: 0
          }
        },
        {
          Key: 2,
          Value: {
            Name: "1-2",
            Up_Pose: 0,
            Down_Pose: 0
          }
        },
      ];
    },
  },
  methods: {
    handleModifyOffsetBtnClick() {
      this.$swal.fire(
        {
          title: 'OFFSET 調整',
          text: `確定要將所有教點位置 OFFSET-${this.offsetVal} ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(res => {
          if (res.isConfirmed) {
            // alert('cool')
            this.TeachDatasShown.forEach(tg => {
              tg.Layers[0].Value.Up_Pose += this.offsetVal;
              tg.Layers[1].Value.Up_Pose += this.offsetVal;
              tg.Layers[2].Value.Up_Pose += this.offsetVal;

              tg.Layers[0].Value.Down_Pose += this.offsetVal;
              tg.Layers[1].Value.Down_Pose += this.offsetVal;
              tg.Layers[2].Value.Down_Pose += this.offsetVal;
            })
          }
        })
    },
    GetRowClass(data) {
      console.log(data.row)
      if (data.row.IsNewAdd || data.row.Tag == 0)
        return 'bg-info'
      else {

        var itemsWithTag = this.TeachDatasShown.filter(item => item.Tag == data.row.Tag);
        if (itemsWithTag.length > 1)
          return 'bg-warning'

        return 'bg-light'
      }
    },
    HandleStationSelected(tag) {

    },
    reload() {
      this.LoadTeachDataFromServer()
      this.HasAnyChange = false;
    },
    async LoadTeachDataFromServer() {
      this.loading = true;
      setTimeout(async () => {
        try {

          this.TeachDatas = await ForkAPI.GetTeachData()
          this.loading = false;
          this.ResetOriDattaString();
        } catch (error) {

          this.loading = false;
        }
      }, 100);
    },
    async SaveHandler() {

      //檢查TAG為0
      const tagZeroItems = this.TeachDatas.filter(item => item.Tag == 0);
      if (tagZeroItems.length != 0) {
        this.$swal.fire(
          {
            title: '請確認Tag設置不可為0',
            text: '',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        return;
      }

      //檢查Tag重覆設置
      const tagCollections = this.TeachDatas.map(item => item.Tag);
      const tagDistineCollections = [...new Set(tagCollections)]

      if (tagCollections.length != tagDistineCollections.length) {
        this.$swal.fire(
          {
            title: 'Tag重覆設置!',
            text: '',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        return;
      }

      const transformedData = {};
      this.TeachDatas.forEach((item) => {
        const tag = item.Tag.toString();
        transformedData[tag] = {};

        item.Layers.forEach((layer) => {
          const key = layer.Key.toString();
          transformedData[tag][key] = layer.Value;

        });
      });
      this.ResetOriDattaString();
      this.InputChanged();
      var response = await ForkAPI.SaveTeachData(transformedData)
      if (response.confirm) {
        // SaveTeachData 不含交握設定；上傳/編輯後的 NeedHandshake 需另外寫回
        await this.SyncAllHandshakeSettings();
        this.LoadTeachDataFromServer()
        this.HasAnyChange = false;
        this.$swal.fire({
          icon: 'success',
          title: 'Fork Teach Data Save',
          text: '儲存成功!'
        })
      }
    },
    async SyncAllHandshakeSettings() {
      const tasks = this.TeachDatas.map(item =>
        ForkAPI.WorkstationHandshakeSetting(item.Tag, !!item.NeedHandshake)
      );
      await Promise.all(tasks);
    },
    InputChanged() {
      //'[{"Tag":8,"Layers":[{"Key":0,"Value":{"Name":"10-0","Up_Pose":12.42,"Down_Pose":12.03}},{"Key":1,"Value":{"Name":"10-1","Up_Pose":23.3,"Down_Pose":22.1}},{"Key":2,"Value":{"Name":"10-2","Up_Pose":123.3,"Down_Pose":121.1}}]}]'
      var currentJson = this.GetNonCommString(this.TeachDatas)
      this.HasAnyChange = currentJson != this.OriDataJson;

    },
    async HandleNeedHandshakeCkbChanged(row) {
      if (this.isImportingTeachData) return;
      await ForkAPI.WorkstationHandshakeSetting(row.Tag, row.NeedHandshake)
    },
    InputClicked(ele) {
      setTimeout(() => {
        this.$refs['teach_tool'].Show(this.selected_data)
      }, 100)

    },
    TagNumberInputClicked(ele) {
      setTimeout(() => {
        this.$refs['teach_tool'].Show(this.selected_data, true)
      }, 100)

    },
    AddTagTeachHandler() {
      var newAry = [{
        Tag: 0,
        Layers: this.NewTagLayerDataTemplate,
        NeedHandshake: true,
        IsNewAdd: true
      }]
      this.TeachDatas = [...newAry, ...this.TeachDatas];
      this.HasAnyChange = true;
    },
    TriggerTeachFileUpload() {
      this.$refs.teachFileInput.value = '';
      this.$refs.teachFileInput.click();
    },
    HandleTeachFileSelected(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const fileName = (file.name || '').toLowerCase();
          let parsed = [];

          if (fileName.endsWith('.json')) {
            parsed = this.ParseTeachPositionFromWorkStationJson(content);
          } else if (fileName.endsWith('.ini')) {
            parsed = this.ParseTeachPositionFromIni(content);
          } else {
            // fallback by content shape
            const trimmed = String(content).trim();
            if (trimmed.startsWith('{')) {
              parsed = this.ParseTeachPositionFromWorkStationJson(content);
            } else {
              parsed = this.ParseTeachPositionFromIni(content);
            }
          }

          if (parsed.length === 0) {
            this.$swal.fire({
              title: '無法解析教點資料',
              text: '請確認為 StationSetting.ini（[TeachPosition]）或 WorkStation.json（Stations / LayerDatas）格式',
              icon: 'warning',
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            });
            return;
          }
          this.isImportingTeachData = true;
          this.TeachDatas = parsed;
          this.selected_tag = 'all';
          this.HasAnyChange = true;
          this.$nextTick(() => {
            this.isImportingTeachData = false;
          });
          this.$swal.fire({
            icon: 'success',
            title: '上傳成功',
            text: `已載入 ${parsed.length} 筆 Tag 教點資料（尚未存檔）`
          });
        } catch (error) {
          this.$swal.fire({
            title: '檔案解析失敗',
            text: error.message || String(error),
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          });
        }
      };
      reader.onerror = () => {
        this.$swal.fire({
          title: '檔案讀取失敗',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        });
      };
      reader.readAsText(file);
    },
    /**
     * WorkStation.json: HandShakeModeHandShakeMode 0=不需交握, 1=需交握
     * Also accepts NeedHandshake / boolean / string forms.
     */
    ResolveNeedHandshake(station) {
      if (!station || typeof station !== 'object') return false;

      if (station.NeedHandshake !== undefined && station.NeedHandshake !== null) {
        return this.CoerceToNeedHandshakeFlag(station.NeedHandshake);
      }

      // Notes key in sample file has trailing space; tolerate both
      const mode = station.HandShakeModeHandShakeMode ??
        station['HandShakeModeHandShakeMode '] ??
        station.HandShakeMode;

      if (mode === undefined || mode === null) return false;
      return this.CoerceToNeedHandshakeFlag(mode);
    },
    CoerceToNeedHandshakeFlag(value) {
      if (value === true || value === false) return value;
      if (typeof value === 'string') {
        const lower = value.trim().toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'needhandshake' || lower === 'handshake') return true;
        if (lower === 'false' || lower === '0' || lower === 'nohandshake' || lower === 'none') return false;
      }
      // 0:不需交握, 1:需交握 (Number(true)===1 also works)
      return Number(value) === 1;
    },
    BuildTeachDataItem(tag, name, layerPoseMap, needHandshake = false) {
      const layers = [0, 1, 2].map(layerKey => {
        const pose = layerPoseMap[layerKey] || { Down_Pose: 0, Up_Pose: 0 };
        return {
          Key: layerKey,
          Value: {
            Name: `${tag}-${layerKey}`,
            Up_Pose: pose.Up_Pose,
            Down_Pose: pose.Down_Pose
          }
        };
      });
      return {
        Tag: tag,
        Name: name || '',
        Layers: layers,
        NeedHandshake: !!needHandshake,
        IsNewAdd: true
      };
    },
    ParseTeachPositionFromWorkStationJson(content) {
      const data = typeof content === 'string' ? JSON.parse(content) : content;
      const stations = data && data.Stations;
      if (!stations || typeof stations !== 'object') return [];

      return Object.keys(stations)
        .map(key => stations[key])
        .filter(station => station && station.Tag != null && station.LayerDatas)
        .map(station => {
          const tag = parseInt(station.Tag, 10);
          const layerDatas = station.LayerDatas || {};
          const layerPoseMap = {};
          Object.keys(layerDatas).forEach(layerKeyStr => {
            const layerKey = parseInt(layerKeyStr, 10);
            if (Number.isNaN(layerKey)) return;
            const layer = layerDatas[layerKeyStr] || {};
            const downPose = parseFloat(layer.Down_Pose);
            const upPose = parseFloat(layer.Up_Pose);
            layerPoseMap[layerKey] = {
              Down_Pose: Number.isNaN(downPose) ? 0 : downPose,
              Up_Pose: Number.isNaN(upPose) ? 0 : upPose
            };
          });
          const needHandshake = this.ResolveNeedHandshake(station);
          return this.BuildTeachDataItem(tag, station.Name, layerPoseMap, needHandshake);
        })
        .filter(item => !Number.isNaN(item.Tag))
        .sort((a, b) => a.Tag - b.Tag);
    },
    ParseTeachPositionFromIni(content) {
      const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      let inTeachPosition = false;
      // tag -> { layer -> { Down_Pose, Up_Pose } }
      const tagMap = {};
      const existingByTag = {};
      this.TeachDatas.forEach(item => {
        existingByTag[item.Tag] = item;
      });

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const sectionMatch = line.match(/^\[(.+)\]$/);
        if (sectionMatch) {
          inTeachPosition = sectionMatch[1].trim().toLowerCase() === 'teachposition';
          continue;
        }
        if (!inTeachPosition) continue;
        if (line.startsWith('#') || line.startsWith(';')) continue;

        // strip inline comments (# or ;)
        const withoutComment = line.split(/[#;]/)[0].trim();
        if (!withoutComment) continue;

        const eqIndex = withoutComment.indexOf('=');
        if (eqIndex < 0) continue;

        const key = withoutComment.slice(0, eqIndex).trim();
        const value = withoutComment.slice(eqIndex + 1).trim();
        const keyMatch = key.match(/^(\d+)_(\d+)$/);
        if (!keyMatch) continue;

        const poses = value.split(',').map(v => v.trim());
        if (poses.length < 2) continue;

        const tag = parseInt(keyMatch[1], 10);
        const layer = parseInt(keyMatch[2], 10);
        const downPose = parseFloat(poses[0]);
        const upPose = parseFloat(poses[1]);
        if (Number.isNaN(downPose) || Number.isNaN(upPose)) continue;

        if (!tagMap[tag]) tagMap[tag] = {};
        tagMap[tag][layer] = { Down_Pose: downPose, Up_Pose: upPose };
      }

      return Object.keys(tagMap)
        .map(tagStr => parseInt(tagStr, 10))
        .sort((a, b) => a - b)
        .map(tag => {
          const existing = existingByTag[tag];
          // INI has no handshake field: keep existing value when possible, otherwise false
          const needHandshake = existing ? !!existing.NeedHandshake : false;
          const name = existing && existing.Name ? existing.Name : '';
          return this.BuildTeachDataItem(tag, name, tagMap[tag], needHandshake);
        });
    },
    ClearTeachDataHandler() {
      this.$swal.fire({
        title: '清除資料',
        text: '確定要清除目前所有教點資料？',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: '取消',
        customClass: 'my-sweetalert'
      }).then(res => {
        if (res.isConfirmed) {
          this.TeachDatas = [];
          this.selected_tag = 'all';
          this.HasAnyChange = true;
        }
      });
    },
    RemoveTagTeachSetting(tagTeach) {
      var index = this.TeachDatas.indexOf(tagTeach)
      this.TeachDatas.splice(index, 1)
      this.InputChanged();
      this.HasAnyChange = true;
    },
    GetNonCommString(object) {
      return JSON.stringify(object).replaceAll('\"', '')
    },
    ResetOriDattaString() {
      this.OriDataJson = this.GetNonCommString(this.TeachDatas)
      this.HasAnyChange = false;
    },
    HandleCellClicked(row, column, cell, event) {
      //property:'Up_Pose:0'
      var prop_splited = column.property.split(':')
      if (prop_splited.length == 1) {
        this.selected_data = {
          tag: row.Tag,
          layer: undefined,
          pose: undefined,
          value: row.Tag
        }
        return
      }
      var pose_prop = prop_splited[0]
      var layer = parseInt(prop_splited[1])
      var value = row.Layers[layer].Value[pose_prop]
      this.selected_data = {
        tag: row.Tag,
        layer: layer,
        pose: pose_prop,
        value: value
      }
    },
    HamdleVirtualKBValuechange(data) {
      var row = this.TeachDatas.find(_data => _data.Tag == data.tag)
      if (data.pose == undefined) {
        row.Tag = data.value
      } else {
        row.Layers[data.layer].Value[data.pose] = data.value
      }
      this.InputChanged()
    }
  },
  mounted() {
    this.reload();
  },
}
</script>
<style lang="scss" scoped></style>