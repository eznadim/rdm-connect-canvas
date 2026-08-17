// Mock RDM Data Manager tree + graph registry.
// Shapes mirror the Node-RED context payload used by the live system.

export type PointType = "input" | "output" | "parameter" | "state";

export type RdmPoint = {
  id: string;
  name: string;
  type: PointType;
  value: string;
  units: string;
};

export type RdmController = {
  id: string;
  name: string;
  ip: string;
  zone: string;
  description: string;
  target: string;
  online: boolean;
  points: RdmPoint[];
};

export type GraphRef = {
  id: string;
  name: string;
  route: string;
};

export const graphs: GraphRef[] = [
  { id: "chiller-plant", name: "Chiller Plant Schematic", route: "chiller-plant" },
  { id: "ahu-old-wing", name: "AHU — Old Wing", route: "ahu-old-wing" },
  { id: "vav-l12-old-wing", name: "VAV Level 12 — Old Wing Table", route: "vav-level12-old-wing-table" },
  { id: "cooling-tower", name: "Cooling Tower Overview", route: "cooling-tower" },
];

const p = (
  id: string,
  name: string,
  type: PointType,
  value: string,
  units = "",
): RdmPoint => ({ id, name, type, value, units });

export const controllers: RdmController[] = [
  {
    id: "TDB31",
    name: "TDB31",
    ip: "10.10.2.53",
    zone: "Old Wing",
    description: "WISMA GENTING_CHILLER PLANT",
    target: "http://www.resourcedm.com/RDMPlantTDB/2022/04/07/",
    online: true,
    points: [
      p("TDB31.CHWS_TEMP", "TEMP CHWS CS2", "input", "7.2", "Deg. C"),
      p("TDB31.CHWR_TEMP", "TEMP CHWR CS2", "input", "12.8", "Deg. C"),
      p("TDB31.CDWS_TEMP", "TEMP CDWS CS2", "input", "31.0", "Deg. C"),
      p("TDB31.CDWR_TEMP", "TEMP CDWR CS2", "input", "35.4", "Deg. C"),
      p("TDB31.CHWS_PRESS", "PRESS CHWS CS2", "input", "2.8", "Bar"),
      p("TDB31.CH1_CMD", "CH1 Start/Stop", "output", "On", ""),
      p("TDB31.CHWP1_CMD", "CHWP-OFF1 Start/Stop", "output", "On", ""),
      p("TDB31.CHWS_SP", "CHWS Setpoint", "parameter", "6.5", "Deg. C"),
      p("TDB31.DP_SP", "Diff. Pressure Setpoint", "parameter", "1.8", "Bar"),
      p("TDB31.CH1_ST", "CH1_State Status", "state", "Run", ""),
      p("TDB31.CHWP1_ST", "CHWP-OFF1_State Status", "state", "Run", ""),
      p("TDB31.CDWP1_ST", "CDWP-OFF1_State Status", "state", "Stop", ""),
    ],
  },
  {
    id: "TDB32",
    name: "TDB32",
    ip: "10.10.2.54",
    zone: "Old Wing",
    description: "WISMA GENTING_CHILLER PLANT 2",
    target: "http://www.resourcedm.com/RDMPlantTDB/2022/04/07/",
    online: true,
    points: [
      p("TDB32.CH2_ST", "CH2_State Status", "state", "Run", ""),
      p("TDB32.CHWP2_ST", "CHWP-OFF2_State Status", "state", "Stop", ""),
      p("TDB32.CDWP2_ST", "CDWP-OFF2_State Status", "state", "Run", ""),
      p("TDB32.FLOW", "FM-CHWS-CS1", "input", "229.6", "m3/hr"),
      p("TDB32.ENERGY", "FM-CHW-ENERGY", "input", "125.3", "kWh"),
      p("TDB32.CH2_CMD", "CH2 Start/Stop", "output", "Off", ""),
      p("TDB32.RESET_SP", "Reset Setpoint", "parameter", "2.0", "Deg. C"),
    ],
  },
  {
    id: "1F01",
    name: "1F01",
    ip: "10.10.2.53",
    zone: "Old Wing",
    description: "WISMA GENTING_AHU OLD WING",
    target: "http://www.resourcedm.com/RDMPlantTDB/2022/04/07/",
    online: true,
    points: [
      p("1F01.RAT", "return_air_temp", "input", "25.4", "Deg. C"),
      p("1F01.SAT", "supply_air_temp", "input", "14.1", "Deg. C"),
      p("1F01.FILTER", "filter_dirty_alarm", "input", "Normal", ""),
      p("1F01.FAN_CMD", "AHU-01_Start Stop", "output", "On", ""),
      p("1F01.MODE", "AHU-01_Mode Selection", "parameter", "System Timer", "None"),
      p("1F01.SP", "AHU-01_Temp Setpoint", "parameter", "23.0", "Deg. C"),
      p("1F01.OP_STATE", "operation_state", "state", "Stop", ""),
      p("1F01.AOM", "aom_state", "state", "Auto", ""),
      p("1F01.TRIP", "trip_status", "state", "Normal", ""),
    ],
  },
  {
    id: "FCULG1",
    name: "FCULG1",
    ip: "10.10.2.61",
    zone: "Lower Ground",
    description: "FCU and Exhaust Fan",
    target: "http://www.resourcedm.com/RDMPlantTDB/2022/04/07/",
    online: false,
    points: [
      p("FCULG1.ST", "FCU-BT1-1-ST", "input", "0.0", ""),
      p("FCULG1.TR", "FCU-BT1-1-TR", "input", "0.0", ""),
      p("FCULG1.MVS", "FCU-BT1-1-MVS", "input", "0.0", ""),
      p("FCULG1.CMD", "FCU-BT1-1-CMD", "output", "0.0", ""),
      p("FCULG1.STATE", "FCU-BT1-1_State", "state", "Offline", ""),
    ],
  },
];

export const pointTypeLabels: Record<PointType, string> = {
  input: "Inputs",
  output: "Outputs",
  parameter: "Parameters",
  state: "States",
};

/* ---------- binding model ---------- */

export type BindKind = "text" | "fill" | "navigation";

export type Binding = {
  id: string;
  cellId: string;
  cellLabel: string;
  kind: BindKind;
  controllerId?: string | undefined;
  pointId?: string | undefined;
  suffix?: string | undefined;
  prefix?: string | undefined;
  decimals?: number | undefined;
  rules?: { match: string; color: string }[] | undefined;
  targetGraphId?: string | undefined;
};

export const defaultFillRules = [
  { match: "Run", color: "#2fae6b" },
  { match: "Stop", color: "#6b7280" },
  { match: "Alarm", color: "#e0483f" },
];

