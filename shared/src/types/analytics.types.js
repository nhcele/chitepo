"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAnalyticsEventDto = exports.TrackEventDto = exports.AnalyticsEventType = void 0;
const class_validator_1 = require("class-validator");
var AnalyticsEventType;
(function (AnalyticsEventType) {
    AnalyticsEventType["LESSON_STARTED"] = "lesson_started";
    AnalyticsEventType["LESSON_COMPLETED"] = "lesson_completed";
    AnalyticsEventType["LESSON_PAUSED"] = "lesson_paused";
    AnalyticsEventType["LESSON_RESUMED"] = "lesson_resumed";
    AnalyticsEventType["QUIZ_STARTED"] = "quiz_started";
    AnalyticsEventType["QUIZ_COMPLETED"] = "quiz_completed";
    AnalyticsEventType["COURSE_ENROLLED"] = "course_enrolled";
    AnalyticsEventType["COURSE_COMPLETED"] = "course_completed";
    AnalyticsEventType["CERTIFICATE_ISSUED"] = "certificate_issued";
    AnalyticsEventType["VIDEO_SEEK"] = "video_seek";
    AnalyticsEventType["VIDEO_SPEED_CHANGE"] = "video_speed_change";
})(AnalyticsEventType || (exports.AnalyticsEventType = AnalyticsEventType = {}));
class TrackEventDto {
}
exports.TrackEventDto = TrackEventDto;
__decorate([
    (0, class_validator_1.IsEnum)(AnalyticsEventType),
    __metadata("design:type", String)
], TrackEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "lessonId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "quizId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TrackEventDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "sessionId", void 0);
class CreateAnalyticsEventDto {
}
exports.CreateAnalyticsEventDto = CreateAnalyticsEventDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AnalyticsEventType),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "lessonId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "quizId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAnalyticsEventDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnalyticsEventDto.prototype, "userAgent", void 0);
//# sourceMappingURL=analytics.types.js.map