import {
  BrokerProfileDto,
  BrokerRoomDto,
  RoomResourceDto,
  RoomEnrollmentDto,
  RegisterBrokerPayload,
  CreateRoomResourcePayload,
  VerifyBrokerPayload,
  ComplianceFlagDto,
} from "@aura/shared";
import { getApiBaseUrl } from "./config";
import { getGlobalAccessToken } from "./auth-token";

export class BrokerApi {
  private get baseUrl(): string {
    return `${getApiBaseUrl()}/api`;
  }

  private get authHeaders(): Record<string, string> {
    const token = getGlobalAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getPublicBrokers(): Promise<BrokerProfileDto[]> {
    const res = await fetch(`${this.baseUrl}/brokers`);
    if (!res.ok) throw new Error("Không thể tải danh sách chuyên gia");
    const json = await res.json();
    return json.data;
  }

  async getPublicRooms(): Promise<BrokerRoomDto[]> {
    const res = await fetch(`${this.baseUrl}/brokers/rooms`);
    if (!res.ok) throw new Error("Không thể tải danh sách phòng đầu tư");
    const json = await res.json();
    return json.data;
  }

  async getRoomDetail(
    roomId: string,
    userId?: string
  ): Promise<BrokerRoomDto & { resources: RoomResourceDto[]; isEnrolled: boolean }> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await fetch(`${this.baseUrl}/brokers/rooms/${roomId}${query}`, {
      headers: this.authHeaders,
    });
    if (!res.ok) throw new Error("Không tìm thấy thông tin phòng");
    const json = await res.json();
    return json.data;
  }

  async registerBroker(payload: RegisterBrokerPayload): Promise<BrokerProfileDto> {
    const res = await fetch(`${this.baseUrl}/brokers/register`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Đăng ký không thành công");
    return json.data;
  }

  async enrollInRoom(
    roomId: string
  ): Promise<{ enrollment: RoomEnrollmentDto; room: BrokerRoomDto }> {
    const res = await fetch(`${this.baseUrl}/brokers/rooms/${roomId}/enroll`, {
      method: "POST",
      headers: this.authHeaders,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Lỗi thanh toán tham gia phòng");
    return json.data;
  }

  async addRoomResource(
    roomId: string,
    payload: CreateRoomResourcePayload
  ): Promise<{ resource: RoomResourceDto; compliance: { isCompliant: boolean; flaggedKeywords: string[] } }> {
    const res = await fetch(`${this.baseUrl}/brokers/rooms/${roomId}/resources`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Lỗi xuất bản tài liệu");
    return json.data;
  }

  async getPendingBrokers(): Promise<BrokerProfileDto[]> {
    const res = await fetch(`${this.baseUrl}/admin/brokers/pending`, {
      headers: this.authHeaders,
    });
    if (!res.ok) throw new Error("Lỗi tải hồ sơ chờ duyệt");
    const json = await res.json();
    return json.data;
  }

  async verifyBroker(
    brokerId: string,
    payload: VerifyBrokerPayload
  ): Promise<BrokerProfileDto> {
    const res = await fetch(`${this.baseUrl}/admin/brokers/${brokerId}/verify`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Lỗi thẩm định hồ sơ");
    return json.data;
  }

  async getComplianceFlags(): Promise<ComplianceFlagDto[]> {
    const res = await fetch(`${this.baseUrl}/admin/brokers/compliance`, {
      headers: this.authHeaders,
    });
    if (!res.ok) throw new Error("Lỗi tải cảnh báo tuân thủ");
    const json = await res.json();
    return json.data;
  }
}

export const brokerApi = new BrokerApi();
