<template>
  <div>
    <div class="d-flex fle-row border-bottom py-1 my-1">
      <el-button type="primary" @click="SaveHandler">儲存</el-button>
      <el-button type="info" @click="AddTagTeachHandler">新增</el-button>
      <el-button type="info" @click="reload">重新載入</el-button>
    </div>
    <div class="text-start py-1">
      <span>設備選擇:</span>
      <el-select v-model="selected_tag" @change="HandleStationSelected" class="mx-2">
        <el-option value="all" label="ALL"></el-option>
        <el-option
          v-for="opt in StationOptions"
          :key="opt.value"
          :value="opt.value"
          :label="opt.text"
        ></el-option>
      </el-select>
    </div>
    <el-table
      @cell-click="HandleCellClicked"
      :data="TeachDatasShown"
      size="small"
      v-loading="loading"
      :row-class-name="GetRowClass"
    >
      <el-table-column label="Tag" prop="Tag">
        <template #default="scope">
          <div>
            <el-input
              @click="TagNumberInputClicked"
              @change="InputChanged"
              type="number"
              v-model="scope.row.Tag"
            ></el-input>
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
            <el-checkbox
              @change="HandleNeedHandshakeCkbChanged(scope.row)"
              v-model="scope.row.NeedHandshake"
            ></el-checkbox>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-for="index in [0, 1, 2]" :key="index" :label="'layer-' + index">
        <el-table-column label="Up Pose(cm)" :prop="`Up_Pose:${index}`">
          <template #default="scope">
            <el-input
              @click="InputClicked"
              @change="InputChanged"
              type="number"
              step="0.01"
              min="0"
              v-if="scope.row.Layers[index] != undefined"
              v-model="scope.row.Layers[index].Value.Up_Pose"
            ></el-input>
          </template>
        </el-table-column>
        <el-table-column label="Down Pose(cm)" :prop="`Down_Pose:${index}`">
          <template #default="scope">
            <el-input
              @click="InputClicked"
              @change="InputChanged"
              type="number"
              step="0.01"
              min="0"
              v-if="scope.row.Layers[index] != undefined"
              v-model="scope.row.Layers[index].Value.Down_Pose"
            ></el-input>
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
      selected_tag: 'all'
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
        this.LoadTeachDataFromServer()
        this.HasAnyChange = false;
        this.$swal.fire({
          icon: 'success',
          title: 'Fork Teach Data Save',
          text: '儲存成功!'
        })
      }
    },
    InputChanged() {
      //'[{"Tag":8,"Layers":[{"Key":0,"Value":{"Name":"10-0","Up_Pose":12.42,"Down_Pose":12.03}},{"Key":1,"Value":{"Name":"10-1","Up_Pose":23.3,"Down_Pose":22.1}},{"Key":2,"Value":{"Name":"10-2","Up_Pose":123.3,"Down_Pose":121.1}}]}]'
      var currentJson = this.GetNonCommString(this.TeachDatas)
      this.HasAnyChange = currentJson != this.OriDataJson;

    },
    async HandleNeedHandshakeCkbChanged(row) {
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