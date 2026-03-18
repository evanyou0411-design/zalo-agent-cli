import { describe, it, expect, beforeEach } from "vitest";
import { ThreadNameCache } from "./thread-name-cache.js";

/** Create a mock API that returns predictable group/friend data */
function createMockApi(groups = {}, friends = []) {
    return {
        getAllGroups: async () => ({
            gridVerMap: Object.fromEntries(Object.keys(groups).map((id) => [id, 1])),
        }),
        getGroupInfo: async (ids) => ({
            gridInfoMap: Object.fromEntries(
                ids.filter((id) => groups[id]).map((id) => [id, groups[id]]),
            ),
        }),
        getAllFriends: async () => friends,
    };
}

describe("ThreadNameCache", () => {
    let cache;

    beforeEach(() => {
        cache = new ThreadNameCache();
    });

    it("starts empty and not ready", () => {
        expect(cache.ready).toBe(false);
        expect(cache.size).toBe(0);
        expect(cache.get("any")).toBeNull();
        expect(cache.getName("any")).toBeNull();
    });

    it("loads groups and friends on init", async () => {
        const api = createMockApi(
            {
                g1: { name: "Nhóm Chờ Báo Giá", totalMember: 20 },
                g2: { name: "Soạn hàng Q. Vũ", totalMember: 15 },
            },
            [
                { userId: "u1", displayName: "Viet Anh", zaloName: "VA" },
                { userId: "u2", zaloName: "Bob" },
            ],
        );

        await cache.init(api);

        expect(cache.ready).toBe(true);
        expect(cache.size).toBe(4);
        expect(cache.get("g1")).toEqual({ name: "Nhóm Chờ Báo Giá", type: "group", memberCount: 20 });
        expect(cache.getName("g2")).toBe("Soạn hàng Q. Vũ");
        expect(cache.get("u1")).toEqual({ name: "Viet Anh", type: "dm" });
        expect(cache.getName("u2")).toBe("Bob");
    });

    it("handles API failures gracefully", async () => {
        const api = {
            getAllGroups: async () => { throw new Error("network error"); },
            getAllFriends: async () => { throw new Error("network error"); },
        };

        await cache.init(api);

        expect(cache.ready).toBe(true);
        expect(cache.size).toBe(0);
    });

    describe("search", () => {
        beforeEach(async () => {
            const api = createMockApi(
                {
                    g1: { name: "Nhóm Chờ Báo Giá", totalMember: 20 },
                    g2: { name: "Soạn hàng Q. Vũ - QV", totalMember: 15 },
                    g3: { name: "Soạn hàng kho 2", totalMember: 8 },
                    g4: { name: "Admin Team", totalMember: 5 },
                },
                [
                    { userId: "u1", displayName: "Soạn Văn", zaloName: "SV" },
                ],
            );
            await cache.init(api);
        });

        it("finds groups by Vietnamese name (accent-insensitive)", () => {
            const results = cache.search("soan hang");
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe("Soạn hàng kho 2");
            expect(results[1].name).toBe("Soạn hàng Q. Vũ - QV");
        });

        it("finds with exact Vietnamese diacritics", () => {
            const results = cache.search("Soạn hàng");
            expect(results).toHaveLength(2);
            expect(results.every((r) => r.type === "group")).toBe(true);
        });

        it("filters by type", () => {
            const groups = cache.search("Soạn", "group");
            expect(groups).toHaveLength(2);
            expect(groups.every((r) => r.type === "group")).toBe(true);

            const dms = cache.search("Soạn", "dm");
            expect(dms).toHaveLength(1);
            expect(dms[0].name).toBe("Soạn Văn");
        });

        it("respects limit parameter", () => {
            const results = cache.search("Soạn", "all", 1);
            expect(results).toHaveLength(1);
        });

        it("returns empty for no match", () => {
            const results = cache.search("xyz_nonexistent");
            expect(results).toHaveLength(0);
        });

        it("prioritizes prefix matches", () => {
            const results = cache.search("Admin");
            expect(results[0].name).toBe("Admin Team");
        });
    });

    describe("set (update)", () => {
        it("updates existing entry", async () => {
            const api = createMockApi({ g1: { name: "Old Name", totalMember: 5 } }, []);
            await cache.init(api);

            cache.set("g1", { name: "New Name" });
            expect(cache.getName("g1")).toBe("New Name");
            expect(cache.get("g1").type).toBe("group");
            expect(cache.get("g1").memberCount).toBe(5);
        });

        it("adds new entry", () => {
            cache.set("new1", { name: "New Group", type: "group", memberCount: 3 });
            expect(cache.get("new1")).toEqual({ name: "New Group", type: "group", memberCount: 3 });
        });
    });
});
