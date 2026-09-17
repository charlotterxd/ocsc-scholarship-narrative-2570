#!/usr/bin/env python3
"""
build_narrative.py — assemble src/data/narrative.json for the ส่วนราชการ
scholarship narrative app (port 8092).

This ETL performs NO PDF extraction. It reads the already-asserted outputs of the
8091 app's pipeline and joins them into one narrative dataset:

    apps/ocsc-budget-scholarship-2570/etl/out/normal_quota_2569.json
    apps/ocsc-budget-scholarship-2570/etl/out/uis_quota_2569.json
    apps/ocsc-budget-scholarship-2570/etl/out/science_quota_2569.json   (fence only)
    apps/ocsc-budget-scholarship-2570/etl/out/recipients.json
    apps/ocsc-budget-scholarship-2570/etl/out/stages_2569.json
    apps/ocsc-budget-scholarship-2570/src/data/scholarship.json
    apps/ocsc-budget-scholarship-2570/src/data/funnel.json

Everything it emits is either copied verbatim from those or derived and asserted.
A wrong number raises here rather than reaching the UI.

Run (there is no local Python on this machine — Docker only):

  MSYS_NO_PATHCONV=1 docker run --rm -v "D:/hackngob_v2:/work" -w //work \
    ocsc-pdf:latest python /work/apps/ocsc-scholarship-narrative-2570/etl/build_narrative.py

SCOPE RULE, enforced by assertion at the end of this file: the ทุนวิทยาศาสตร์ฯ
(science) track is a different funding source, outside the 493-seat frame, and is
excluded from this app entirely. The science quota is loaded only so that the
stage-1 choice codes can be classified — no science figure is written out.
"""

from __future__ import annotations

import json
import os
import sys
from collections import Counter

ROOT = "/work"
SRC = os.path.join(ROOT, "apps", "ocsc-budget-scholarship-2570")
OUT = os.path.join(ROOT, "apps", "ocsc-scholarship-narrative-2570", "src", "data", "narrative.json")

# The quota JSONs keep the announcement's raw wording, in which a PDF table line-wrap
# shows up as a space inside an organisation name ("สำนักงาน สภาพัฒนาการ เศรษฐกิจและสังคม
# แห่งชาติ"). funnel.json's byAgency is already normalised through thaijoin, so reading the
# quota files raw made the SAME agency appear under two spellings in adjacent cards of one
# section. Use the same normaliser the funnel ETL uses — never a local re-implementation.
sys.path.insert(0, os.path.join(SRC, "etl", "announcements"))
from thaijoin import unwrap_org  # noqa: E402


def load(*parts: str):
    with open(os.path.join(SRC, *parts), encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# inputs
# ---------------------------------------------------------------------------

normal_quota = load("etl", "out", "normal_quota_2569.json")
uis_quota = load("etl", "out", "uis_quota_2569.json")
science_quota = load("etl", "out", "science_quota_2569.json")
recipients = load("etl", "out", "recipients.json")
stages = load("etl", "out", "stages_2569.json")
scholarship = load("src", "data", "scholarship.json")
funnel = load("src", "data", "funnel.json")

STAGE_SET = {s["key"]: s for s in stages["sets"]}
REC_SET = {(s["track"], s["year"]): s for s in recipients["sets"]}
FUNNEL_TRACK = {t["track"]: t for t in funnel["tracks"]}

SCIENCE_CODES = {u["unitCode"] for u in science_quota["units"]}


# ---------------------------------------------------------------------------
# section 1 — งบประมาณ
# ---------------------------------------------------------------------------

subsidy = scholarship["subsidy"]
assert [s["year"] for s in subsidy] == [2568, 2569, 2570], subsidy
assert [s["budget"] for s in subsidy] == [950_000_000, 950_000_000, 800_000_000], subsidy

selection = scholarship["selection"]
assert len(selection) == 3, len(selection)
LINE = {s["name"].split()[0]: s for s in selection}
assert set(LINE) == {"1.1", "1.2", "1.3"}, sorted(LINE)

# The three figures sections 3 and 4 hang on. Stated in the brief; asserted here so a
# re-extraction that moves them cannot silently change the narrative.
assert LINE["1.2"]["b68"] == 430_000 and LINE["1.2"]["b69"] == 280_000 and LINE["1.2"]["b70"] == 460_000
assert LINE["1.3"]["b68"] == 0 and LINE["1.3"]["b69"] == 0 and LINE["1.3"]["b70"] == 80_000

ASSESSMENT = "ค่าใช้จ่ายในการทำกิจกรรม Assessment Center Methods"
assessment_items = []
for key in ("1.1", "1.2", "1.3"):
    hits = [it for it in LINE[key]["items"] if it["name"] == ASSESSMENT]
    assert len(hits) == 1, (key, len(hits))
    it = hits[0]
    assert it["b68"] == 0 and it["b69"] == 0 and it["b70"] > 0, (key, it)
    assessment_items.append({"line": key, "lineName": LINE[key]["name"], "b70": it["b70"]})
assessment_total_70 = sum(it["b70"] for it in assessment_items)
assert assessment_total_70 == 280_000, assessment_total_70

# line 1.2's 2569 cut, almost entirely the venue fee
venue = "ค่าบำรุงสถานศึกษา/ค่าธรรมเนียมสถานศึกษาที่ใช้เป็นสนามสอบ"
venue_12 = [it for it in LINE["1.2"]["items"] if it["name"] == venue]
assert len(venue_12) == 1
assert venue_12[0]["b68"] == 400_000 and venue_12[0]["b69"] == 250_000, venue_12


# ---------------------------------------------------------------------------
# section 2 — กรอบการจัดสรร 493 / แถว 2.1
# ---------------------------------------------------------------------------

framework = scholarship["framework"]
frame_allocated = sum(r["allocated"] for r in framework)
frame_taken = sum(r["taken"] or 0 for r in framework)
assert frame_allocated == 493, frame_allocated
assert frame_taken == 53, frame_taken

row21 = [r for r in framework if r["name"].startswith("2.1")]
assert len(row21) == 1, len(row21)
row21 = row21[0]
assert row21["allocated"] == 285 and row21["taken"] == 2, row21


# ---------------------------------------------------------------------------
# the two in-frame tracks
# ---------------------------------------------------------------------------

TRACKS = (
    {
        "track": "normal",
        "stageKey": "degree",
        "quota": normal_quota,
        "budgetLine": "1.2",
        "shortLabel": "ทุนบุคคลทั่วไประดับปริญญา",
        # stage-1 for this track is a *subset* of a shared sitting
        "sharedExam": True,
    },
    {
        "track": "uis",
        "stageKey": "uis",
        "quota": uis_quota,
        "budgetLine": "1.3",
        "shortLabel": "ทุนดึงดูดผู้มีศักยภาพสูง (UIS)",
        "sharedExam": False,
    },
)

out_tracks = []

for spec in TRACKS:
    track = spec["track"]
    quota = spec["quota"]
    stage = STAGE_SET[spec["stageKey"]]
    rec = REC_SET[(track, 2569)]
    ft = FUNNEL_TRACK[track]

    assert ft["inFrame"] is True, track

    units = {u["unitCode"]: u for u in quota["units"]}
    awarded_by_unit = {u["unitCode"]: u for u in rec["units"]}
    assert set(units) == set(awarded_by_unit), track

    seats = sum(u["seats"] for u in units.values())
    awarded = sum(u["awarded"] for u in awarded_by_unit.values())
    assert len(units) == quota["statedUnits"] == ft["statedUnits"], track
    assert seats == quota["statedSeats"] == ft["seats"], track
    assert awarded == ft["awarded"], track

    # --- stage 1 -----------------------------------------------------------
    stage1 = stage["stage1"]
    assert len(stage1) == stage["applicants"], track
    choices = [c for a in stage1 for c in a["choices"]]
    assert len(choices) == stage["applicantChoices"], track

    # every choice code must resolve to a unit we know; for the shared degree sitting
    # that means this track's units OR the science ones.
    known = set(units) | (SCIENCE_CODES if spec["sharedExam"] else set())
    unresolved = sorted({c for c in choices if c not in known})
    assert not unresolved, (track, unresolved)

    applicants_here = [a for a in stage1 if any(c in units for c in a["choices"])]
    n_applicants = len(applicants_here)

    # --- stage 2 -----------------------------------------------------------
    stage2 = stage["stage2"]
    # The stage-2 announcement must cover exactly this track's units, nothing else.
    assert set(stage2) == set(units), (track, sorted(set(stage2) ^ set(units)))
    slots = sum(len(v) for v in stage2.values())
    people = len({e for v in stage2.values() for e in v})
    assert slots == stage["shortlistSlots"], track
    assert people == stage["shortlisted"], track

    # Integrity: nobody may be shortlisted for a unit they did not choose. This is the
    # check that caught the 680151413 unit-code typo — keep it.
    chose = {a["examId"]: set(a["choices"]) for a in stage1}
    violations = [(code, e) for code, ids in stage2.items() for e in ids if code not in chose.get(e, set())]
    assert not violations, (track, violations[:5])

    shortlisted_ids = {e for v in stage2.values() for e in v}
    awarded_ids = {e for u in awarded_by_unit.values() for e in u["examIds"]}
    assert shortlisted_ids <= {a["examId"] for a in applicants_here}, track
    assert awarded_ids <= shortlisted_ids, track
    assert len(awarded_ids) == awarded, (track, len(awarded_ids), awarded)

    # --- why the empty units are empty ------------------------------------
    demand = Counter(choices)
    causes = Counter()
    empty_units = []
    per_unit = []
    for code, u in units.items():
        n_app = demand[code]
        n_short = len(stage2[code])
        n_award = awarded_by_unit[code]["awarded"]
        agency = unwrap_org(u["agency"])
        # Idempotency, the same check build_funnel.py makes: unwrapping an already-clean
        # name must be a no-op, so a future wording change cannot silently split one agency
        # into two spellings again.
        assert unwrap_org(agency) == agency, (track, code, u["agency"], agency)
        row = {
            "unitCode": code,
            "agency": agency,
            "position": unwrap_org(u.get("position")),
            "field": u.get("field"),
            "level": u.get("level"),
            "seats": u["seats"],
            "applicants": n_app,
            "shortlisted": n_short,
            "awarded": n_award,
        }
        per_unit.append(row)
        if n_award == 0:
            if n_app == 0:
                cause = "noApplicants"
            elif n_short == 0:
                cause = "noneShortlisted"
            else:
                cause = "shortlistedNotAwarded"
            causes[cause] += 1
            empty_units.append({**row, "cause": cause})

    empty_total = len(empty_units)
    assert empty_total == ft["unfilledUnits"], (track, empty_total, ft["unfilledUnits"])
    assert sum(causes.values()) == empty_total

    per_unit.sort(key=lambda r: (-r["applicants"], r["unitCode"]))

    # --- diagnostics the recommendations section stands on ----------------
    apps_sorted = sorted(r["applicants"] for r in per_unit)
    median_apps = apps_sorted[len(apps_sorted) // 2]
    gate1_empty_apps = sorted(u["applicants"] for u in empty_units if u["cause"] == "noneShortlisted")
    # A unit that reached the assessment round with a shortlist no larger than its seat
    # count has no spare candidate: one adverse assessment and the seat is lost. Units with
    # an empty shortlist are excluded — they never reached the assessment at all, so they
    # are a gate-1 failure, not a thin-reserve one.
    no_reserve = [r for r in per_unit if 0 < r["shortlisted"] <= r["seats"]]
    no_reserve_empty = [r for r in no_reserve if r["awarded"] == 0]
    # Second choice WITHIN this track. For ทุนบุคคลทั่วไป this is 0 of 1,389 — the second
    # choice may only be spent on a track excluded from this report, so a candidate who
    # loses at an over-subscribed unit can never be considered for an empty one.
    in_track_second = sum(1 for a in applicants_here if sum(1 for c in a["choices"] if c in units) > 1)
    top5 = sum(r["applicants"] for r in per_unit[:5])
    total_choices = sum(r["applicants"] for r in per_unit)

    diagnostics = {
        "medianApplicantsPerUnit": median_apps,
        "gate1EmptyApplicants": gate1_empty_apps,
        "shortlistPeoplePerSeat": round(people / seats, 2),
        "noReserveUnits": len(no_reserve),
        "noReserveEndedEmpty": len(no_reserve_empty),
        "inTrackSecondChoice": in_track_second,
        "clearedNotAwarded": len(shortlisted_ids - awarded_ids),
        "top5DemandShare": round(top5 / total_choices * 100, 1),
    }

    out_tracks.append(
        {
            "track": track,
            "label": quota["trackLabel"],
            "shortLabel": spec["shortLabel"],
            "budgetLine": spec["budgetLine"],
            "budgetLineName": LINE[spec["budgetLine"]]["name"],
            "announcementDate": ft["announcementDate"],
            "units": len(units),
            "seats": seats,
            "awarded": awarded,
            "fillPct": round(awarded / seats * 100, 2),
            "unfilledSeats": seats - awarded,
            "sharedExam": spec["sharedExam"],
            "stage1": {
                "applicants": n_applicants,
                "choices": sum(1 for c in choices if c in units),
                "sittingTotal": stage["applicants"] if spec["sharedExam"] else None,
            },
            "stage2": {"people": people, "slots": slots},
            "stage3": {"awarded": awarded},
            "emptyUnits": {
                "total": empty_total,
                "noApplicants": causes["noApplicants"],
                "noneShortlisted": causes["noneShortlisted"],
                "shortlistedNotAwarded": causes["shortlistedNotAwarded"],
                "units": empty_units,
            },
            "topDemand": per_unit[:10],
            "byAgency": ft["byAgency"],
            "diagnostics": diagnostics,
        }
    )

BY_TRACK = {t["track"]: t for t in out_tracks}

# Section 5 renders per-unit rows (topDemand, emptyUnits) next to the byAgency roll-up.
# Those two come from different files, so every agency spelling in the unit rows must also
# exist in that track's byAgency — otherwise one organisation shows up twice under two
# names in the same section. This is the check that the raw-wording bug slipped past.
for t in out_tracks:
    known = {a["name"] for a in t["byAgency"]}
    for row in t["topDemand"] + t["emptyUnits"]["units"]:
        assert row["agency"] in known, (
            f"{t['track']} {row['unitCode']}: agency {row['agency']!r} is absent from byAgency — "
            f"the per-unit and roll-up views disagree on this organisation's name"
        )

# the two figures sections 2 and 5 are built on
open_seats = sum(t["seats"] for t in out_tracks)
open_awarded = sum(t["awarded"] for t in out_tracks)
assert open_seats == 88, open_seats
assert open_awarded == 64, open_awarded
assert open_seats + 197 == row21["allocated"], (open_seats, row21["allocated"])

# The two sittings are different exams (6913… vs 6915… series) and the ETL keeps no
# names, so applicants CANNOT be added across tracks. Assert the series are disjoint
# so nothing downstream is tempted to sum them.
degree_ids = {a["examId"] for a in STAGE_SET["degree"]["stage1"]}
uis_ids = {a["examId"] for a in STAGE_SET["uis"]["stage1"]}
assert not (degree_ids & uis_ids), "exam id series overlap — the no-summing rule needs revisiting"

# named facts the observations section states outright
top_normal = BY_TRACK["normal"]["topDemand"][0]
assert top_normal["unitCode"] == "690151404" and top_normal["applicants"] == 121 and top_normal["seats"] == 1, top_normal
assert BY_TRACK["normal"]["stage1"]["applicants"] == 1389
assert BY_TRACK["normal"]["stage1"]["sittingTotal"] == 1671
assert BY_TRACK["normal"]["stage2"]["people"] == 185 == BY_TRACK["normal"]["stage2"]["slots"]
assert BY_TRACK["uis"]["stage2"]["people"] == 33 and BY_TRACK["uis"]["stage2"]["slots"] == 49
assert BY_TRACK["normal"]["emptyUnits"]["noApplicants"] == 0

gate_early = sum(t["emptyUnits"]["noneShortlisted"] for t in out_tracks)
gate_late = sum(t["emptyUnits"]["shortlistedNotAwarded"] for t in out_tracks)
gate_none = sum(t["emptyUnits"]["noApplicants"] for t in out_tracks)
empty_all = sum(t["emptyUnits"]["total"] for t in out_tracks)
assert (gate_none, gate_early, gate_late, empty_all) == (1, 12, 11, 24), (gate_none, gate_early, gate_late, empty_all)


# ---------------------------------------------------------------------------
# section 6 — ข้อสังเกต
#
# Every item states a figure the documents state about themselves, with the page or
# file it comes from. No motive is imputed anywhere.
# ---------------------------------------------------------------------------

observations = [
    {
        "id": "demand-not-constraint",
        "title": "อุปสงค์ไม่ใช่ข้อจำกัด — ที่นั่งว่างเกิดที่ด่านคัดเลือก ไม่ใช่ที่การรับสมัคร",
        "body": (
            f"หน่วยทุนที่ไม่มีผู้ได้รับทุนเลยมี {empty_all} หน่วย จาก 88 ที่นั่งที่เปิดสอบแข่งขัน "
            f"ในจำนวนนี้มีเพียง {gate_none} หน่วยที่ไม่มีผู้สมัครเลือกเลย "
            f"อีก {gate_early} หน่วยมีผู้สมัครแต่ไม่มีใครผ่านเข้ารอบสอง และ {gate_late} หน่วยมีผู้เข้ารอบสองแต่ไม่มีใครได้รับทุน "
            f"หน่วยที่ {top_normal['unitCode']} ({top_normal['agency']}) มีผู้สมัครเลือก {top_normal['applicants']} คน ต่อ {top_normal['seats']} ที่นั่ง"
        ),
        "source": "ประกาศ ก.พ. ปี 2569 — รายชื่อผู้สมัคร / ผู้มีสิทธิเข้ารับการประเมิน / ผู้มีสิทธิได้รับทุน",
        "kind": "finding",
    },
    {
        "id": "assessment-center-gate",
        "title": "งบ Assessment Center ปี 2570 มุ่งไปที่ด่านที่สอง แต่ด่านแรกคัดคนออกมากกว่า",
        "body": (
            f"ปี 2570 ตั้งงบ “{ASSESSMENT}” รวม {assessment_total_70:,.0f} บาท กระจายในรายการ 1.1 / 1.2 / 1.3 "
            f"(จากเดิม 0 บาททั้งปี 2568 และ 2569) ด่านที่งบก้อนนี้รองรับคือการประเมินรอบสอง "
            f"ซึ่งเป็นจุดที่ทำให้ {gate_late} หน่วยไม่ได้ผู้รับทุน ขณะที่ {gate_early} หน่วยหยุดอยู่ก่อนหน้านั้น "
            f"คือไม่มีผู้สมัครรายใดผ่านเกณฑ์การสอบข้อเขียนเข้ารอบสองเลย"
        ),
        "source": "mainfile.pdf รายการ 1.1–1.3 (งบคัดเลือก) เทียบกับประกาศผลปี 2569",
        "kind": "finding",
    },
    {
        "id": "row21-under-reported",
        "title": "ตารางกรอบจัดสรรในเอกสารงบ ระบุแถว 2.1 ว่าได้ผู้รับทุนแล้ว 2 ราย ขณะที่ประกาศระบุ 64 ราย",
        "body": (
            f"กรอบจัดสรรทุนปี 2569 (สถานะ ณ 3 ก.ค. 2569) ระบุแถว 2.1 จำนวน {row21['allocated']} ที่นั่ง "
            f"และช่อง “ดำเนินการแล้ว” เท่ากับ {row21['taken']} ราย ({row21['takenNote']}) "
            f"รวมทั้งกรอบ {frame_allocated} ที่นั่ง ระบุดำเนินการแล้ว {frame_taken} ราย "
            f"แต่ประกาศรายชื่อผู้มีสิทธิได้รับทุนของสองทุนที่อยู่ในแถว 2.1 ซึ่งลงวันที่ 14 พฤศจิกายน 2568 "
            f"คือก่อนหน้าวันที่ของตาราง ระบุผู้มีสิทธิได้รับทุนแล้ว {open_awarded} ราย"
        ),
        "source": "mainfile.pdf หน้า 62–64 เทียบกับประกาศ ก.พ. 14 พ.ย. 2568",
        "kind": "discrepancy",
    },
    {
        "id": "uis-zero-budget",
        "title": "ทุน UIS จัดสอบแข่งขันเต็มรูปแบบในปี 2569 โดยรายการงบคัดเลือก 1.3 ตั้งไว้ 0 บาท",
        "body": (
            f"ปีงบประมาณ 2569 ทุน UIS มีผู้สมัคร {BY_TRACK['uis']['stage1']['applicants']} คน "
            f"ผู้มีสิทธิเข้ารับการประเมิน {BY_TRACK['uis']['stage2']['people']} คน "
            f"และผู้มีสิทธิได้รับทุน {BY_TRACK['uis']['awarded']} คน "
            f"ขณะที่รายการ “{LINE['1.3']['name']}” ตั้งงบไว้ 0 บาท ทั้งปี 2568 และ 2569 "
            f"งบก้อนแรกของรายการนี้ปรากฏในปี 2570 จำนวน {LINE['1.3']['b70']:,.0f} บาท"
        ),
        "source": "mainfile.pdf รายการ 1.3 เทียบกับประกาศ UIS ปี 2569",
        "kind": "finding",
    },
    {
        "id": "line12-cut",
        "title": "รายการ 1.2 ถูกลดลง 35% ในปี 2569 เกือบทั้งหมดมาจากค่าสนามสอบ",
        "body": (
            f"งบคัดเลือกทุนระดับปริญญา (รายการ 1.2) ลดจาก {LINE['1.2']['b68']:,.0f} บาท ในปี 2568 "
            f"เหลือ {LINE['1.2']['b69']:,.0f} บาท ในปี 2569 ส่วนต่าง {LINE['1.2']['b68'] - LINE['1.2']['b69']:,.0f} บาท "
            f"โดย {venue_12[0]['b68'] - venue_12[0]['b69']:,.0f} บาท มาจากค่าสนามสอบรายการเดียว "
            f"({venue_12[0]['b68']:,.0f} → {venue_12[0]['b69']:,.0f} บาท) "
            f"ปีเดียวกันนี้เป็นปีที่มีผู้เข้าสอบ {STAGE_SET['degree']['applicants']:,} คน"
        ),
        "source": "mainfile.pdf รายการ 1.2",
        "kind": "observation",
    },
    {
        "id": "unit-code-typos",
        "title": "เลขหน่วยทุนพิมพ์ผิดสองรายการ ทำให้ผลถูกนับเข้าหน่วยผิดถ้าไม่ตรวจจับ",
        "body": (
            "ประกาศผู้มีสิทธิเข้ารับการประเมิน ปี 2569 พิมพ์เลขหน่วยของสำนักงานเศรษฐกิจการคลังเป็น 680151413 "
            "(ขึ้นต้น 68 ซึ่งเป็นปี 2568) และประกาศผู้มีสิทธิได้รับทุนทุนวิทยาศาสตร์ฯ พิมพ์ 680330032 ในลักษณะเดียวกัน "
            "กรณีแรกทำให้ผู้เข้ารอบสองหกรายถูกนับรวมเข้ากับหน่วยก่อนหน้า ยอดรวมทุกตัวยังถูกต้อง "
            "การนับผิดหน่วยจึงตรวจไม่พบด้วยการตรวจยอดรวม ต้องใช้เงื่อนไขว่าผู้เข้ารอบสองต้องเลือกหน่วยนั้นจริง"
        ),
        "source": "oscc/2569_normal_stage2.pdf, oscc/2569_science_recepient.pdf",
        "kind": "discrepancy",
    },
    {
        "id": "continuing-scholars",
        "title": "จำนวนนักเรียนทุนเดิมในเอกสารไม่ตรงกันระหว่างสองหน้า",
        "body": scholarship["notes"]["countryMismatch"],
        "source": "mainfile.pdf หน้า 56 และ 57",
        "kind": "discrepancy",
    },
    {
        "id": "frame-500-493",
        "title": "กรอบที่อนุมัติ 500 ทุน กับที่จัดสรรแล้ว 493 ทุน เป็นคนละจำนวน ไม่ใช่ความคลาดเคลื่อน",
        "body": (
            f"เอกสารระบุกรอบที่ อ.ก.พ. วิสามัญฯ อนุมัติเมื่อ 27 มิ.ย. 2568 ไว้ที่ 500 ทุน "
            f"ขณะที่ตารางสถานะ ณ 3 ก.ค. 2569 รวมได้ {frame_allocated} ทุน "
            f"ส่วนต่าง 7 ทุนคือที่นั่งที่ยังไม่ได้เปิด ทั้งสองจำนวนเอกสารระบุไว้เอง จึงไม่ใช่ข้อผิดพลาด"
        ),
        "source": "mainfile.pdf หน้า 62 และ 64",
        "kind": "observation",
    },
]


# ---------------------------------------------------------------------------
# section 7 — ข้อเสนอเชิงนโยบาย
#
# Unlike ส่วนที่ 6, this section is explicitly the analyst's judgement, not a restatement
# of the document. Each item therefore carries `basis` — the figures it rests on — and the
# section carries `caveat`, which states the one question the data cannot settle. Still no
# imputed motive: every "should" is about a mechanism, never about anyone's intent.
# ---------------------------------------------------------------------------

data_asof = "3 ก.ค. 2569"
data_fill = round(open_awarded / open_seats * 100, 1)
ND = BY_TRACK["normal"]["diagnostics"]
UD = BY_TRACK["uis"]["diagnostics"]
agencies_in_both = sorted(
    {a["name"] for a in BY_TRACK["normal"]["byAgency"]} & {a["name"] for a in BY_TRACK["uis"]["byAgency"]}
)
no_reserve_all = ND["noReserveUnits"] + UD["noReserveUnits"]
no_reserve_empty_all = ND["noReserveEndedEmpty"] + UD["noReserveEndedEmpty"]

recommendations = [
    {
        "id": "reconcile-framework",
        "title": "สอบทานตารางกรอบจัดสรรกับประกาศผลก่อนเสนอคำของบประมาณ",
        "body": (
            f"ตารางกรอบจัดสรรระบุแถว 2.1 ว่าดำเนินการแล้ว {row21['taken']} ราย ณ {data_asof} "
            f"ขณะที่ประกาศรายชื่อผู้มีสิทธิได้รับทุนของสองทุนในแถวเดียวกัน ลงวันที่ 14 พฤศจิกายน 2568 "
            f"ซึ่งเป็นเวลาก่อนหน้าราวแปดเดือน ระบุไว้แล้ว {open_awarded} ราย "
            f"ผู้พิจารณางบประมาณที่อ่านตัวเลข {row21['taken']} จาก {row21['allocated']} "
            f"ย่อมสรุปว่าการดำเนินงานยังแทบไม่คืบหน้า การปรับสถานะให้ตรงกับประกาศที่เผยแพร่แล้ว "
            f"เป็นการแก้ไขที่ไม่มีต้นทุนและให้ผลต่อความเข้าใจมากที่สุด"
        ),
        "basis": f"กรอบจัดสรรแถว 2.1 (ดำเนินการแล้ว {row21['taken']}) เทียบประกาศผล ({open_awarded} ราย)",
        "theme": "การรายงาน",
    },
    {
        "id": "exercise-clause-910",
        "title": "ใช้อำนาจทดแทนข้ามหน่วยทุนตามข้อ ๙.๑๐ ที่ประกาศกำหนดไว้แล้ว หรือชี้แจงเหตุที่ใช้ไม่ได้",
        "body": (
            f"ประกาศรับสมัครปี 2569 ข้อ ๙.๑๐ ระบุไว้เองว่า “กรณีที่ทุนหน่วยใดไม่มีผู้สมัครสอบหรือไม่มีผู้มีสิทธิได้รับทุน "
            f"คณะกรรมการดำเนินการสอบแข่งขันและคัดเลือกฯ อาจพิจารณาให้ผู้สอบแข่งขันได้จากทุนหน่วยอื่น หรือทุนอื่น "
            f"เป็นผู้มีสิทธิได้รับทุนแทน” กลไกนี้จึงมีอยู่แล้ว และครอบคลุมสถานการณ์ที่เกิดขึ้นจริงพอดี "
            f"แต่ผลปี 2569 คือมี {empty_all} หน่วยที่ไม่มีผู้ได้รับทุน ขณะที่มีผู้ผ่านการสอบข้อเขียน "
            f"แต่ไม่ได้รับทุน {ND['clearedNotAwarded'] + UD['clearedNotAwarded']} คน ในการสอบครั้งเดียวกัน "
            f"ข้อ ๙.๑๐ ใช้คำว่า “อาจ” จึงเป็นดุลพินิจ ไม่ใช่หน้าที่ "
            f"ข้อเสนอคือกำหนดให้การพิจารณาตามข้อ ๙.๑๐ เป็นขั้นตอนปกติทุกครั้งที่มีหน่วยว่าง "
            f"และให้รายงานเหตุผลเมื่อไม่สามารถทดแทนได้ เพื่อให้ทราบว่าที่นั่งว่างเกิดจากข้อจำกัดด้านคุณวุฒิ "
            f"หรือเกิดจากการไม่ได้พิจารณา"
        ),
        "basis": (
            f"ประกาศรับสมัครปี 2569 ข้อ ๙.๑๐ (ทดแทนข้ามหน่วย) เทียบข้อ ๙.๘–๙.๙ (ทดแทนภายในหน่วยเดิม) · "
            f"หน่วยที่ว่าง {empty_all} หน่วย · ผ่านข้อเขียนแต่ไม่ได้รับทุน "
            f"{ND['clearedNotAwarded'] + UD['clearedNotAwarded']} คน"
        ),
        "theme": "การใช้กฎที่มีอยู่",
    },
    {
        "id": "mean-threshold",
        "title": "ทบทวนเกณฑ์ผ่านข้อเขียนที่อิงค่าเฉลี่ยรวม ซึ่งทำให้หน่วยที่มีผู้สมัครน้อยว่างโดยโครงสร้าง",
        "body": (
            f"ประกาศข้อ ๙.๒.๑ และ ๙.๒.๒ กำหนดว่าผู้มีสิทธิเข้ารับการประเมินต้องได้คะแนนทั้งวิชาภาษาอังกฤษ "
            f"และวิชาความสามารถทั่วไปเชิงวิชาการ “ไม่ต่ำกว่าคะแนนเฉลี่ย (Mean) ของผู้เข้าสอบทั้งหมด” "
            f"เกณฑ์นี้เป็นเกณฑ์เชิงเปรียบเทียบที่คิดจากผู้เข้าสอบทั้งชุด {STAGE_SET['degree']['applicants']:,} คน "
            f"ไม่ใช่เกณฑ์เฉพาะของแต่ละหน่วยทุน โดยนิยามแล้วจึงมีผู้เข้าสอบราวครึ่งหนึ่งอยู่ต่ำกว่าค่าเฉลี่ยในแต่ละวิชา "
            f"หน่วยที่มีผู้สมัครน้อยจึงมีโอกาสสูงที่จะไม่มีผู้ผ่านเลย ด้วยเหตุผลทางเลขคณิต ไม่ใช่เพราะคุณภาพผู้สมัคร "
            f"หน่วยทั้ง {len(ND['gate1EmptyApplicants'])} แห่งของทุนบุคคลทั่วไปที่ไม่มีใครผ่านด่านแรก มีผู้สมัคร "
            f"{min(ND['gate1EmptyApplicants'])}–{max(ND['gate1EmptyApplicants'])} คน เทียบกับค่ากลางทั้งทุนที่ "
            f"{ND['medianApplicantsPerUnit']} คนต่อหน่วย "
            f"ข้อสังเกตประกอบ: เพดานบัญชีผู้เข้ารอบสองตามข้อ ๙.๒.๓ อยู่ที่ ๕ เท่าต่อ ๑ ทุน แต่ที่เกิดขึ้นจริงคือ "
            f"{ND['shortlistPeoplePerSeat']} คนต่อที่นั่ง ปัญหาจึงอยู่ที่พื้นคะแนน ไม่ใช่ที่เพดาน"
        ),
        "basis": (
            f"ประกาศข้อ ๙.๒.๑–๙.๒.๓ · ผู้สมัครของหน่วยที่ไม่มีใครผ่านด่านแรก {ND['gate1EmptyApplicants']} คน "
            f"เทียบค่ากลาง {ND['medianApplicantsPerUnit']} คนต่อหน่วย · "
            f"บัญชีผู้เข้ารอบสองจริง {ND['shortlistPeoplePerSeat']} คนต่อที่นั่ง (เพดาน ๕ เท่า)"
        ),
        "theme": "กระบวนการคัดเลือก",
    },
    {
        "id": "thin-reserve",
        "title": "หน่วยที่มีผู้เข้ารอบสองไม่เกินจำนวนที่นั่ง ไม่มีตัวสำรองเมื่อผู้ถูกประเมินไม่ผ่านเกณฑ์ร้อยละ ๗๐",
        "body": (
            f"ประกาศข้อ ๙.๓ กำหนดว่าผู้สอบแข่งขันได้ต้องมีคะแนนการประเมินความเหมาะสมไม่ต่ำกว่าร้อยละ ๗๐ "
            f"เมื่อรวมกับข้อ ๙.๘–๙.๙ ซึ่งให้เลื่อนผู้ที่ได้คะแนนลำดับถัดไป “ของทุนหน่วยนั้น” เท่านั้น "
            f"หน่วยที่มีผู้เข้ารอบสองไม่เกินจำนวนที่นั่งจึงไม่มีลำดับถัดไปให้เลื่อน "
            f"ปี 2569 มีหน่วยลักษณะนี้ {no_reserve_all} หน่วย และในจำนวนนั้น {no_reserve_empty_all} หน่วยลงเอยด้วยที่นั่งว่าง "
            f"ความลึกของบัญชีผู้เข้ารอบสองอยู่ที่ {ND['shortlistPeoplePerSeat']} คนต่อที่นั่งในทุนบุคคลทั่วไป "
            f"และ {UD['shortlistPeoplePerSeat']} คนต่อที่นั่งในทุน UIS"
        ),
        "basis": (
            f"ประกาศข้อ ๙.๓ (เกณฑ์ร้อยละ ๗๐) และข้อ ๙.๘–๙.๙ (เลื่อนลำดับภายในหน่วยเดิม) · "
            f"หน่วยที่ไม่มีตัวสำรอง {no_reserve_all} หน่วย ว่างจริง {no_reserve_empty_all} หน่วย"
        ),
        "theme": "กระบวนการคัดเลือก",
    },
    {
        "id": "one-unit-per-track",
        "title": "พิจารณาให้เลือกหน่วยทุนได้มากกว่าหนึ่งหน่วยภายในประเภททุนเดียวกัน",
        "body": (
            f"ประกาศข้อ ๖.๕ กำหนดว่าผู้สมัครมีสิทธิสมัครได้ ๒ ประเภททุน โดยแต่ละประเภททุนเลือกได้ ๑ หน่วยทุน "
            f"และข้อ ๖.๖ ห้ามเพิ่ม ถอน หรือเปลี่ยนหน่วยทุนภายหลัง ข้อมูลปี 2569 สอดคล้องกับกฎนี้ทุกประการ "
            f"คือไม่มีผู้สมัครรายใดเลยจาก {BY_TRACK['normal']['stage1']['applicants']:,} คน "
            f"ที่เลือกหน่วยทุนบุคคลทั่วไปมากกว่าหนึ่งหน่วย "
            f"ผลคือผู้สมัครที่เลือกหน่วยซึ่งมีการแข่งขันสูงและไม่ได้รับทุน ไม่มีหน่วยสำรองให้พิจารณา "
            f"ขณะที่หน่วยซึ่งมีผู้สมัครน้อยก็ไม่มีโอกาสเข้าถึงผู้สมัครกลุ่มนั้น "
            f"ข้อสังเกตประกอบ: ทุน UIS เปิดให้เลือก ๒ หน่วยทุนอยู่แล้ว และ {UD['inTrackSecondChoice']} จาก "
            f"{BY_TRACK['uis']['stage1']['applicants']} คนใช้สิทธิ์นั้น แต่ยังเติมที่นั่งได้ต่ำกว่า "
            f"({BY_TRACK['uis']['fillPct']}% เทียบ {BY_TRACK['normal']['fillPct']}%) "
            f"การเปิดให้เลือกหลายหน่วยเพียงอย่างเดียวจึงไม่เพียงพอ ต้องใช้ร่วมกับการพิจารณาทดแทนข้ามหน่วยตามข้อ ๙.๑๐ ข้างต้น"
        ),
        "basis": (
            f"ประกาศข้อ ๖.๕–๖.๖ · ผู้เลือกสองหน่วยในประเภททุนเดียวกัน: ทุนบุคคลทั่วไป "
            f"{ND['inTrackSecondChoice']} จาก {BY_TRACK['normal']['stage1']['applicants']:,} คน, "
            f"UIS {UD['inTrackSecondChoice']} จาก {BY_TRACK['uis']['stage1']['applicants']} คน"
        ),
        "theme": "โครงสร้างการสมัคร",
    },
    {
        "id": "budget-covers-one-gate",
        "title": "งบ Assessment Center ปี 2570 ครอบคลุมด่านเดียวจากสองด่านที่ทำให้ที่นั่งว่าง",
        "body": (
            f"งบ {assessment_total_70:,.0f} บาท รองรับการประเมินรอบสอง ซึ่งเป็นด่านที่ทำให้ {gate_late} หน่วยไม่ได้ผู้รับทุน "
            f"แต่อีก {gate_early} หน่วยหยุดก่อนถึงด่านนั้น คือไม่มีผู้สมัครรายใดผ่านการสอบข้อเขียน "
            f"คำของบปี 2570 ยังไม่มีรายการใดที่มุ่งไปยังด่านแรกหรือไปยังขนาดของกลุ่มผู้สมัคร "
            f"ทั้งที่ปี 2569 รายการ 1.2 ถูกปรับลด {LINE['1.2']['b68'] - LINE['1.2']['b69']:,.0f} บาท "
            f"ในปีที่มีผู้เข้าสอบ {STAGE_SET['degree']['applicants']:,} คน"
        ),
        "basis": f"หน่วยว่างแยกตามด่าน: ก่อนรอบสอง {gate_early} หน่วย, ที่รอบสอง {gate_late} หน่วย, ไม่มีผู้สมัคร {gate_none} หน่วย",
        "theme": "งบประมาณ",
    },
    {
        "id": "targeted-recruitment",
        "title": "ประชาสัมพันธ์แบบเจาะจงหน่วยทุนที่มีผู้สมัครน้อย",
        "body": (
            f"อุปสงค์ไม่ได้ขาด แต่กระจุกตัว หน่วยทุน 5 อันดับแรกของทุนบุคคลทั่วไปรับผู้สมัครรวม "
            f"{ND['top5DemandShare']}% ของทั้งทุน ขณะที่หน่วยซึ่งไม่มีใครผ่านด่านแรกมีผู้สมัครเพียง "
            f"{min(ND['gate1EmptyApplicants'])}–{max(ND['gate1EmptyApplicants'])} คน "
            f"ตัวอย่างที่ชัดที่สุดคือหน่วยงานเดียวกันที่มีที่นั่งอยู่ทั้งสองทุน "
            f"มี {len(agencies_in_both)} หน่วยงานในลักษณะนี้ และบางแห่งเติมที่นั่งได้ต่างกันมาก "
            f"ทั้งที่เป็นส่วนราชการเดียวกันในปีเดียวกัน ความต่างจึงอยู่ที่กลุ่มผู้สมัครที่ประกาศไปถึง "
            f"ไม่ใช่ที่ตัวส่วนราชการ"
        ),
        "basis": (
            f"ความกระจุกตัว: 5 หน่วยแรก = {ND['top5DemandShare']}% ของผู้สมัครทุนบุคคลทั่วไป · "
            f"หน่วยงานที่มีที่นั่งทั้งสองทุน {len(agencies_in_both)} แห่ง"
        ),
        "theme": "การรับสมัคร",
    },
    {
        "id": "budget-matches-activity",
        "title": "ตั้งงบรายการคัดเลือกให้ตรงกับกิจกรรมที่ดำเนินจริง",
        "body": (
            f"รายการ {LINE['1.3']['name']} ตั้งไว้ 0 บาท ทั้งปี 2568 และ 2569 "
            f"ขณะที่ปี 2569 ทุน UIS ดำเนินการสอบแข่งขันเต็มรูปแบบ มีผู้สมัคร "
            f"{BY_TRACK['uis']['stage1']['applicants']} คน และประกาศผลครบทุกขั้นตอน "
            f"ค่าใช้จ่ายที่เกิดขึ้นจริงจึงถูกรับไว้ที่รายการอื่นโดยไม่ปรากฏในบรรทัดนี้ "
            f"ทำให้ต้นทุนต่อการคัดเลือกหนึ่งรอบของทุนนี้ตรวจสอบไม่ได้จากเอกสารงบประมาณ"
        ),
        "basis": f"รายการ 1.3 = 0 บาท ปี 2568 และ 2569, {LINE['1.3']['b70']:,.0f} บาท ปี 2570",
        "theme": "งบประมาณ",
    },
    {
        "id": "unit-code-validation",
        "title": "ตรวจสอบเลขหน่วยทุนอัตโนมัติก่อนเผยแพร่ประกาศ",
        "body": (
            "พบเลขหน่วยทุนพิมพ์ผิดสองรายการในประกาศปี 2569 โดยขึ้นต้นด้วย 68 แทน 69 "
            "กรณีหนึ่งทำให้ผู้เข้ารอบสองหกรายถูกนับรวมเข้ากับหน่วยก่อนหน้า "
            "ยอดรวมทุกตัวยังถูกต้อง การตรวจด้วยยอดรวมจึงไม่พบความผิดพลาดประเภทนี้ "
            "ควรตรวจว่าเลขหน่วยทุกเลขที่ปรากฏในประกาศผลมีอยู่จริงในประกาศรับสมัครปีเดียวกัน "
            "และผู้เข้ารอบสองทุกรายต้องเคยเลือกหน่วยนั้นไว้"
        ),
        "basis": "oscc/2569_normal_stage2.pdf (680151413), oscc/2569_science_recepient.pdf (680330032)",
        "theme": "คุณภาพข้อมูล",
    },
]

rec_caveat = (
    f"ข้อเสนอข้างต้นตั้งอยู่บนสมมติฐานว่าที่นั่งว่าง {empty_all} หน่วยเป็นสิ่งที่ควรลด "
    f"ซึ่งข้อมูลชุดนี้พิสูจน์ไม่ได้ อัตราเติมที่นั่ง {data_fill}% อาจสะท้อนการรักษามาตรฐานการคัดเลือกไว้อย่างเคร่งครัด "
    f"และการเติมที่นั่งให้เต็มด้วยการลดเกณฑ์ย่อมเป็นผลเสียมากกว่า ข้อมูลบอกได้เพียงกลไกที่ทำให้ที่นั่งว่าง "
    f"ไม่ได้บอกว่าผลลัพธ์นั้นพึงประสงค์หรือไม่ "
    f"อย่างไรก็ดี คำของบประมาณยังคงขอที่นั่งเหล่านี้ต่อเนื่อง ซึ่งสื่อว่าต้องการให้เติมเต็ม "
    f"ขณะที่กระบวนการปฏิบัติต่อเกณฑ์อย่างเคร่งครัด ซึ่งสื่อว่ายอมให้ว่างได้ "
    f"สำนักงาน ก.พ. ควรระบุให้ชัดว่าถือแนวทางใด เพราะข้อเสนอที่เกี่ยวกับเกณฑ์คัดเลือกและโครงสร้างการเลือกหน่วยทุน "
    f"จะสมเหตุสมผลเฉพาะภายใต้แนวทางแรกเท่านั้น ส่วนข้อเสนอเรื่องการรายงานและคุณภาพข้อมูลใช้ได้ทั้งสองแนวทาง"
)


# ---------------------------------------------------------------------------
# assemble
# ---------------------------------------------------------------------------

data = {
    "meta": {
        "title": "จากงบประมาณถึงผู้รับทุน : เส้นทางทุนรัฐบาล ก.พ. ปีงบประมาณ 2569–2570",
        "agency": scholarship["meta"]["agency"],
        "ministry": scholarship["meta"]["ministry"],
        "fiscalYear": scholarship["meta"]["fiscalYear"],
        "hearingDate": scholarship["meta"]["hearingDate"],
        "sources": [
            "reference/mainfile.pdf — คำชี้แจงงบประมาณ สำนักงาน ก.พ. ปี 2570 (104 หน้า)",
            "ประกาศสำนักงาน ก.พ. ปีงบประมาณ 2569 — รับสมัคร / รายชื่อผู้สมัคร / ผู้มีสิทธิเข้ารับการประเมิน / ผู้มีสิทธิได้รับทุน",
        ],
        "note": "ทุกตัวเลขในหน้านี้ถูกสอบยันกับตัวเลขที่เอกสารต้นทางระบุเอง เป็น assertion ในสคริปต์ ETL",
        "privacy": "เก็บเฉพาะจำนวนและเลขประจำตัวสอบระหว่างประมวลผล ไม่มีรายชื่อบุคคลใดปรากฏในข้อมูลชุดนี้",
    },
    "scopes": {
        "science": (
            "ทุนรัฐบาลทางด้านวิทยาศาสตร์และเทคโนโลยี (90 ที่นั่ง จัดสรรให้กระทรวง อว.) "
            "เป็นคนละแหล่งทุนและอยู่นอกกรอบ 493 ที่นั่ง จึงไม่นับรวมในหน้านี้ทั้งหมด"
        ),
        "sharedExam": (
            "ทุนบุคคลทั่วไปและทุนวิทยาศาสตร์ฯ ใช้การสอบชุดเดียวกัน ผู้สมัครเลือกหน่วยทุนได้สูงสุด 2 อันดับ "
            f"และเลือกข้ามสองทุนได้ ผู้เข้าสอบทั้งชุดมี {STAGE_SET['degree']['applicants']:,} คน "
            f"ในจำนวนนี้ {BY_TRACK['normal']['stage1']['applicants']:,} คนเลือกหน่วยทุนบุคคลทั่วไปอย่างน้อยหนึ่งอันดับ "
            "ตัวเลขนี้เป็นส่วนย่อยของผู้เข้าสอบทั้งชุด ไม่ใช่จำนวนผู้เข้าสอบของทุนบุคคลทั่วไปโดยเฉพาะ "
            "และไม่สามารถแยกการสอบออกเป็นรายทุนได้"
        ),
        "noSumApplicants": (
            "ทุนบุคคลทั่วไปและทุน UIS สอบคนละชุด (เลขประจำตัวสอบคนละชุดเลข) "
            "และข้อมูลชุดนี้ไม่เก็บรายชื่อ จึงไม่สามารถทราบได้ว่ามีผู้สมัครซ้ำระหว่างสองทุนหรือไม่ "
            "จำนวนผู้สมัครของสองทุนจึงไม่ถูกนำมาบวกกันในหน้านี้"
        ),
        "openCompetition": (
            f"88 ที่นั่งในหน้านี้คือทุนบุคคลทั่วไป ({BY_TRACK['normal']['seats']}) และ UIS ({BY_TRACK['uis']['seats']}) "
            f"ซึ่งเป็นสองส่วนของแถว 2.1 ในกรอบจัดสรรปี 2569 ที่มี {row21['allocated']} ที่นั่ง "
            "ส่วนที่เหลือ 197 ที่นั่งคือทุนพัฒนาบุคลากรภาครัฐสำหรับข้าราชการประจำ ซึ่งไม่มีการสอบแข่งขันเปิด"
        ),
        "uisSlots": (
            "ผู้มีสิทธิเข้ารับการประเมินของทุน UIS ปรากฏได้ในหน่วยทุนที่เลือกไว้มากกว่าหนึ่งหน่วย "
            f"ยอดรายหน่วยจึงรวมได้ {BY_TRACK['uis']['stage2']['slots']} รายการ "
            f"ขณะที่จำนวนคนจริงคือ {BY_TRACK['uis']['stage2']['people']} คน"
        ),
        "eligible": (
            "“ผู้มีสิทธิได้รับทุน” คือผู้ที่ผ่านการคัดเลือกและมีสิทธิรับทุน ไม่ใช่จำนวนผู้ที่เดินทางไปศึกษาจริง"
        ),
    },
    "budget": {
        "subsidy": subsidy,
        "subsidyNote": scholarship["notes"]["exec69"],
        "selection": selection,
        "assessment": {"items": assessment_items, "total70": assessment_total_70},
    },
    "frame": {
        "approved": 500,
        "allocated": frame_allocated,
        "takenTotal": frame_taken,
        "row21": {
            "name": row21["name"],
            "allocated": row21["allocated"],
            "taken": row21["taken"],
            "takenNote": row21["takenNote"],
        },
        "openSeats": open_seats,
        "otherInRow21": row21["allocated"] - open_seats,
        "asOf": "3 ก.ค. 2569",
        "approvedOn": "27 มิ.ย. 2568",
        "byGroup": [
            {
                "groupNo": g,
                "group": next(r["group"] for r in framework if r["groupNo"] == g),
                "allocated": sum(r["allocated"] for r in framework if r["groupNo"] == g),
            }
            for g in sorted({r["groupNo"] for r in framework})
        ],
    },
    "tracks": out_tracks,
    "totals": {
        "seats": open_seats,
        "awarded": open_awarded,
        "fillPct": round(open_awarded / open_seats * 100, 2),
        "emptyUnits": empty_all,
        "gates": {"noApplicants": gate_none, "noneShortlisted": gate_early, "shortlistedNotAwarded": gate_late},
    },
    "observations": observations,
    "recommendations": {
        "items": recommendations,
        "caveat": rec_caveat,
        "note": (
            "ส่วนนี้เป็นข้อเสนอจากการวิเคราะห์ ไม่ใช่ข้อความที่ปรากฏในเอกสารต้นทาง "
            "ต่างจากส่วนที่ 6 ซึ่งระบุเฉพาะสิ่งที่เอกสารระบุไว้เอง ทุกข้อจึงกำกับฐานตัวเลขที่ใช้ไว้ด้วย"
        ),
    },
}

# ---------------------------------------------------------------------------
# the science fence, enforced on the serialized output
# ---------------------------------------------------------------------------

blob = json.dumps(data, ensure_ascii=False, indent=1)

for code in SCIENCE_CODES:
    assert code not in blob, f"science unit code {code} leaked into narrative.json"
# Naming the track is allowed only where the text exists to fence it off: the scopes
# captions and the observations. Anywhere else — a chart series, a track row, an agency
# label — means a science figure has leaked in. Build the allowance from exactly those
# strings, so a leak elsewhere raises.
fenced = json.dumps([data["scopes"], observations, data["recommendations"]], ensure_ascii=False)
for word in ("วิทยาศาสตร์และเทคโนโลยี", "วิทยาศาสตร์ฯ", "science", "อว."):
    hits = blob.count(word)
    allowed = fenced.count(word)
    assert hits == allowed, f"unfenced mention of {word!r}: {hits} in output, {allowed} inside scopes/observations"

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(blob)
    fh.write("\n")

print(f"wrote {OUT} ({len(blob):,} bytes)")
print(f"  frame {frame_allocated} ที่นั่ง, row 2.1 = {row21['allocated']}, เปิดสอบแข่งขัน {open_seats}")
for t in out_tracks:
    s1 = t["stage1"]["applicants"]
    print(
        f"  {t['track']:7s} ผู้สมัคร {s1:5,} → เข้ารอบ 2 {t['stage2']['people']:4,}"
        f" → ได้รับทุน {t['awarded']:3,} / {t['seats']:3,} ที่นั่ง  ({t['fillPct']:.1f}%)"
        f"   ว่าง {t['emptyUnits']['total']:2d} หน่วย"
        f" = {t['emptyUnits']['noApplicants']}/{t['emptyUnits']['noneShortlisted']}/{t['emptyUnits']['shortlistedNotAwarded']}"
    )
print(f"  รวม {open_awarded}/{open_seats} ที่นั่ง ({data['totals']['fillPct']:.1f}%), ว่าง {empty_all} หน่วย")
