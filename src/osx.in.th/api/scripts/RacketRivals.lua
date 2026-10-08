-- [[ OSX HUB - RACKET RIVALS PRIVATE SCRIPT ]] --
-- UI Template v4.0.41

local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Racket Rivals"

-- [[ LIBRARY LOADER ]] --
local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    warn("OSX: Local file not found, loading from GitHub...")
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end

-- [[ CONFIGURATION ]] --
local Config = {
    TP = {
        Enabled = false,
        Height = 5,
        Target = "BallShadow",
        Mode = "Hold RMB", -- "Always", "Hold RMB"
        Smoothness = 0.25
    },
    Spam = {
        Enabled = false,
        F = false,
        E = false,
        K1 = false,
        K2 = false,
        Delay = 0.1
    },
    Player = {
        WalkSpeed = 16,
        JumpPower = 50
    }
}

-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ 1. INFO TAB ]] --
local TabInfo = Window:AddTab({ Title = "info", Icon = "info", SubDescription = "Script Information" })

local DevPanel = TabInfo:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer", "LilYouDev1997x")
DevPanel:AddInfoLabel("Last Update", "21/04/2026")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- [[ 2. MAIN TAB ]] --
local TabMain = Window:AddTab({ Title = "Main", Icon = "home", SubDescription = "Main Features" })
local MainPanel = TabMain:AddPanel("TP Lock (Ball)")

MainPanel:AddToggle({
    Title = "Enable TP Lock",
    Description = "ล็อกตำแหน่งไปยังเป้าหมาย (Hold RMB)",
    Default = false,
    Flag = "TP_Enabled",
    Callback = function(v) Config.TP.Enabled = v end
})

MainPanel:AddSlider({
    Title = "TP Height",
    Description = "ความสูงเหนือเป้าหมาย (Studs)",
    Min = 0,
    Max = 50,
    Default = 5,
    Rounding = 1,
    Flag = "TP_Height",
    Callback = function(v) Config.TP.Height = v end
})

MainPanel:AddSlider({
    Title = "TP Smoothness",
    Description = "ความสมูทในการเคลื่อนที่ (ค่าน้อย = ช้า)",
    Min = 0,
    Max = 1,
    Default = 0.25,
    Rounding = 2,
    Flag = "TP_Smoothness",
    Callback = function(v) Config.TP.Smoothness = v end
})

MainPanel:AddDropdown({
    Title = "TP Mode",
    Description = "เลือกโหมดการทำงานของ TP Lock",
    Values = {"Hold RMB", "Always"},
    Default = "Hold RMB",
    Flag = "TP_Mode",
    Callback = function(v) Config.TP.Mode = v end
})

local SpamPanel = TabMain:AddPanel("Auto Spam Keys")

SpamPanel:AddToggle({
    Title = "Enable Auto Spam",
    Description = "เปิดใช้งานระบบกดปุ่มอัตโนมัติ",
    Default = false,
    Flag = "Spam_Enabled",
    Callback = function(v) Config.Spam.Enabled = v end
})

SpamPanel:AddToggle({ 
    Title = "Auto Swing & Smash", 
    Description = "กดปุ่ม F อัตโนมัติ (สวิง/ตบลูก)", 
    Default = false, 
    Flag = "Spam_F",
    Callback = function(v) Config.Spam.F = v end 
})

SpamPanel:AddToggle({ 
    Title = "Auto Set", 
    Description = "กดปุ่ม E อัตโนมัติ (เซ็ตลูก)", 
    Default = false, 
    Flag = "Spam_E",
    Callback = function(v) Config.Spam.E = v end 
})

SpamPanel:AddToggle({ 
    Title = "Auto Main Skill", 
    Description = "กดปุ่ม 1 อัตโนมัติ (สกิลหลัก)", 
    Default = false, 
    Flag = "Spam_1",
    Callback = function(v) Config.Spam.K1 = v end 
})

SpamPanel:AddToggle({ 
    Title = "Auto Ultimate Skill", 
    Description = "กดปุ่ม 2 อัตโนมัติ (สกิลไม้ตาย)", 
    Default = false, 
    Flag = "Spam_2",
    Callback = function(v) Config.Spam.K2 = v end 
})

SpamPanel:AddSlider({
    Title = "Spam Delay",
    Description = "ความเร็วในการกด (วินาที)",
    Min = 0.01,
    Max = 1,
    Default = 0.1,
    Rounding = 2,
    Flag = "Spam_Delay",
    Callback = function(v) Config.Spam.Delay = v end
})


-- [[ 4. SETTINGS TAB ]] --
local TabSettings = Window:AddTab({ Title = "Settings", Icon = "settings", SubDescription = "UI & Config" })
local ConfigPanel = TabSettings:AddPanel("UI Management")

ConfigPanel:AddButton({
    Title = "Destroy UI",
    Description = "ปิดการทำงานของเมนู",
    Callback = function() Window:Destroy() end
})

local ConfigManager = TabSettings:AddPanel("Configuration Manager")
local ConfigName = "Default"

ConfigManager:AddInput({
    Title = "Config Name",
    Description = "ชื่อไฟล์สำหรับบันทึกการตั้งค่า",
    Default = "Default",
    Placeholder = "Enter name...",
    Callback = function(v) ConfigName = v end
})

ConfigManager:AddButton({
    Title = "Save Config",
    Description = "บันทึกการตั้งค่าปัจจุบันลงในไฟล์",
    Callback = function() 
        OSX:SaveConfig(ConfigName) 
        OSX:Notify({Title = "Config Manager", Content = "Saved: " .. ConfigName .. ".json", Type = "Success"})
    end
})

ConfigManager:AddButton({
    Title = "Load Config",
    Description = "โหลดการตั้งค่าจากไฟล์ที่ระบุ",
    Callback = function() 
        OSX:LoadConfig(ConfigName) 
        OSX:Notify({Title = "Config Manager", Content = "Loaded: " .. ConfigName .. ".json", Type = "Success"})
    end
})

-- [[ SERVICES ]] --
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- [[ LOGIC: TP LOCK (PHYSICS BASED) ]] --
local function findTarget()
    return workspace:FindFirstChild(Config.TP.Target, true)
end

local function GetTPParts(root)
    local att = root:FindFirstChild("OSX_TP_Attachment") or Instance.new("Attachment", root)
    att.Name = "OSX_TP_Attachment"
    
    local ap = root:FindFirstChild("OSX_TP_Align") or Instance.new("AlignPosition", root)
    ap.Name = "OSX_TP_Align"
    ap.Mode = Enum.PositionAlignmentMode.OneAttachment
    ap.Attachment0 = att
    ap.MaxForce = math.huge
    
    local ao = root:FindFirstChild("OSX_TP_Orient") or Instance.new("AlignOrientation", root)
    ao.Name = "OSX_TP_Orient"
    ao.Mode = Enum.OrientationAlignmentMode.OneAttachment
    ao.Attachment0 = att
    ao.MaxTorque = math.huge
    
    return ap, ao
end

RunService.RenderStepped:Connect(function()
    local char = LocalPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    
    if not root then return end
    
    local ap, ao = GetTPParts(root)
    
    if Config.TP.Enabled then
        local isHoldingRMB = UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton2)
        local shouldLock = (Config.TP.Mode == "Always") or (Config.TP.Mode == "Hold RMB" and isHoldingRMB)
        
        if shouldLock then
            local target = findTarget()
            
            if target then
                local pos = target.Position + Vector3.new(0, Config.TP.Height, 0)
                local targetCF = CFrame.new(pos, pos + workspace.CurrentCamera.CFrame.LookVector)
                
                ap.Enabled = true
                ao.Enabled = true
                ap.Position = pos
                ao.CFrame = targetCF
                
                -- Use Smoothness to control responsiveness (Scaled for AlignPosition)
                ap.Responsiveness = Config.TP.Smoothness * 200
                ao.Responsiveness = Config.TP.Smoothness * 200
                
                -- Reset velocity to keep it tight
                root.AssemblyLinearVelocity = Vector3.new(0, 0, 0)
                root.AssemblyAngularVelocity = Vector3.new(0, 0, 0)
                return
            end
        end
    end
    
    -- Disable if not locking
    ap.Enabled = false
    ao.Enabled = false
end)

-- [[ LOGIC: AUTO SPAM ]] --
local VirtualInputManager = game:GetService("VirtualInputManager")

local function PressKey(keyCode)
    VirtualInputManager:SendKeyEvent(true, keyCode, false, game)
    task.wait(0.01)
    VirtualInputManager:SendKeyEvent(false, keyCode, false, game)
end

task.spawn(function()
    while true do
        if Config.Spam.Enabled then
            if Config.Spam.F then PressKey(Enum.KeyCode.F) end
            if Config.Spam.E then PressKey(Enum.KeyCode.E) end
            if Config.Spam.K1 then PressKey(Enum.KeyCode.One) end
            if Config.Spam.K2 then PressKey(Enum.KeyCode.Two) end
        end
        task.wait(Config.Spam.Delay)
    end
end)

-- [[ STARTUP ]] --
OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})
