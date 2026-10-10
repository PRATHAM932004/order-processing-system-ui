import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { KafkaEvent } from "@/lib/types";

interface KafkaState {
  clusterStatus: "OPERATIONAL" | "DEGRADED" | "DOWN";
  brokerAddress: string;
  activePartitions: number;
  totalPartitions: number;
  activeConsumerGroups: number;
  avgLatencyMs: number;
  consumerLag: number;
  isStreamActive: boolean;
  selectedTopic: string;
  recentEvents: KafkaEvent[];
}

const initialState: KafkaState = {
  clusterStatus: "OPERATIONAL",
  brokerAddress: "localhost:9092 (Broker 1)",
  activePartitions: 8,
  totalPartitions: 8,
  activeConsumerGroups: 3,
  avgLatencyMs: 14,
  consumerLag: 0,
  isStreamActive: true,
  selectedTopic: "orders.v1",
  recentEvents: [],
};

export const kafkaSlice = createSlice({
  name: "kafka",
  initialState,
  reducers: {
    addLiveEvent: (state, action: PayloadAction<KafkaEvent>) => {
      state.recentEvents.unshift(action.payload);
      if (state.recentEvents.length > 50) {
        state.recentEvents.pop();
      }
    },
    toggleStream: (state) => {
      state.isStreamActive = !state.isStreamActive;
    },
    setSelectedTopic: (state, action: PayloadAction<string>) => {
      state.selectedTopic = action.payload;
    },
    updateLag: (state, action: PayloadAction<number>) => {
      state.consumerLag = action.payload;
    },
    updateLatency: (state, action: PayloadAction<number>) => {
      state.avgLatencyMs = action.payload;
    },
  },
});

export const { addLiveEvent, toggleStream, setSelectedTopic, updateLag, updateLatency } =
  kafkaSlice.actions;

export default kafkaSlice.reducer;
