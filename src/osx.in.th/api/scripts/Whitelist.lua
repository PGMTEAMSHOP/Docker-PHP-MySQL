-- [[ ระบบตรวจสอบ Key สำหรับ Script ]]
local HttpService = game:GetService("HttpService")
local RbxAnalyticsService = game:GetService("RbxAnalyticsService")

-- ตั้งค่า URL ของคุณที่นี่ (สำหรับการทดสอบในเครื่องใช้ localhost:3000)
local API_URL = "https://hub.osx.in.th"

local function getHWID()
    return RbxAnalyticsService:GetClientId()
end

local function verifyKey(key)
    local hwid = getHWID()
    local url = API_URL .. "/verify?key=" .. key .. "&hwid=" .. hwid
    
    local success, response = pcall(function()
        return HttpService:GetAsync(url)
    end)
    
    if success then
        local data = HttpService:JSONDecode(response)
        return data
    else
        return { success = false, message = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" }
    end
end

-- วิธีใช้งานเบื้องต้น
local myKey = "VZ79AOHPA76EMNZX" -- ใส่ Key ที่ได้จากบอท
local result = verifyKey(myKey)

if result.success then
    print("✅ ตรวจสอบผ่าน: " .. result.message)
    -- เริ่มรัน Script ของคุณที่นี่
else
    warn("❌ ตรวจสอบไม่ผ่าน: " .. result.message)
    -- หยุดการทำงาน
    return
end
