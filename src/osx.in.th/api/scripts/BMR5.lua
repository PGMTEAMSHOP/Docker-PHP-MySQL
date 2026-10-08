-- [[ OSX HUB - BMR5 PRIVATE SCRIPT ]] --
-- UI Template v4.0.41 (Combat & Aimbot Update)

local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

-- [[ LIBRARY LOADER ]] --
local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success or not OSX then
    warn("OSX: Local file not found or failed to load, loading from GitHub...")
    local githubSuccess, githubOSX = pcall(function()
        return loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
    end)
    if githubSuccess and githubOSX then
        OSX = githubOSX
    else
        error("OSX: Failed to load library from both local file and GitHub!")
    end
end

-- [[ CONFIGURATION ]] --
local Config = {
    Combat = { 
        Aimbot = false,
        Smoothness = 0.5,
        FOV = 150,
        ShowFOV = true,
        WallCheck = false,
        NoRecoil = false,
        FastFire = false,
        TurretFastFire = false,
        UnlockFiremodes = false,
        NoBoltAction = false
    },
    Visuals = {
        EspEnabled = false,
        ESPType = "Bot + Player",
        ESPMode = "Corner Box",
        EspDistance = 1000,
        ShowDistance = true,
        ShowTracers = false,
        PlayerColor = Color3.fromRGB(255, 255, 255),
        BotColor = Color3.fromRGB(255, 255, 255),
        TracerColor = Color3.fromRGB(255, 255, 255),
        ChamsColor = Color3.fromRGB(255, 255, 255),
        FullBright = false,
        NoFog = false,
        CleanNVG = false
    }
}

-- [[ SERVICES ]] --
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Camera = workspace.CurrentCamera
local LocalPlayer = game.Players.LocalPlayer

-- [[ STATE & BACKUPS ]] --
local IsRunning = true
local Highlights = {}
local EspDrawings = {}
local OriginalWeaponConfigs = {}
local OriginalTurretConfigs = {}
local OriginalBulletGetInfo = nil
local BulletTable = nil
local OriginalDischarge = nil
local OriginalLighting = {
    Brightness = Lighting.Brightness,
    ClockTime = Lighting.ClockTime,
    GlobalShadows = Lighting.GlobalShadows,
    OutdoorAmbient = Lighting.OutdoorAmbient,
    Ambient = Lighting.Ambient,
    FogStart = Lighting.FogStart,
    FogEnd = Lighting.FogEnd
}

local OriginalEffects = {}
local function backupEffects(parent)
    if not parent then return end
    for _, v in ipairs(parent:GetChildren()) do
        if v:IsA("PostProcessEffect") then
            OriginalEffects[v] = v.Enabled
        elseif v:IsA("Atmosphere") then
            OriginalEffects[v] = {Density = v.Density, Haze = v.Haze}
        end
    end
end
backupEffects(Lighting)
backupEffects(workspace.CurrentCamera)

local FOVCircle = Drawing.new("Circle")
FOVCircle.Thickness = 1.5
FOVCircle.Color = Color3.new(1, 1, 1)
FOVCircle.Filled = false
FOVCircle.Transparency = 0.5

-- [[ CONNECTION REFS ]] --
local VisualsConnection
local DescendantAddedConnection

-- [[ CLEANUP FUNCTION ]] --
local function Cleanup()
    IsRunning = false
    
    -- Disconnect events
    if VisualsConnection then VisualsConnection:Disconnect() end
    if DescendantAddedConnection then DescendantAddedConnection:Disconnect() end
    pcall(function() RunService:UnbindFromRenderStep("OSX_Aimbot") end)
    
    -- Remove drawings
    if FOVCircle then
        FOVCircle:Remove()
    end
    
    -- Restore lighting and effects
    pcall(function()
        Lighting.Brightness = OriginalLighting.Brightness
        Lighting.ClockTime = OriginalLighting.ClockTime
        Lighting.GlobalShadows = OriginalLighting.GlobalShadows
        Lighting.OutdoorAmbient = OriginalLighting.OutdoorAmbient
        Lighting.Ambient = OriginalLighting.Ambient
        Lighting.FogStart = OriginalLighting.FogStart
        Lighting.FogEnd = OriginalLighting.FogEnd
        
        for effect, state in pairs(OriginalEffects) do
            if effect.Parent then
                if effect:IsA("Atmosphere") then
                    effect.Density = state.Density
                    effect.Haze = state.Haze
                else
                    effect.Enabled = state
                end
            end
        end
    end)
    
    -- Destroy highlights and drawings
    for model, h in pairs(Highlights) do
        pcall(function() h:Destroy() end)
    end
    table.clear(Highlights)
    
    for model, _ in pairs(EspDrawings) do
        local data = EspDrawings[model]
        if data then
            for _, l in ipairs(data.Lines) do pcall(function() l:Remove() end) end
            pcall(function() data.HpBg:Remove() end)
            pcall(function() data.HpFg:Remove() end)
            pcall(function() data.Dist:Remove() end)
            if data.Tracer then pcall(function() data.Tracer:Remove() end) end
        end
    end
    table.clear(EspDrawings)
    
    -- Restore weapons config
    for tune, backup in pairs(OriginalWeaponConfigs) do
        pcall(function()
            tune.Recoil_X = backup.Recoil_X
            tune.Recoil_Z = backup.Recoil_Z
            tune.RecoilForce_Tap = backup.RecoilForce_Tap
            tune.RecoilForce_Impulse = backup.RecoilForce_Impulse
            tune.Recoil_Camera = backup.Recoil_Camera
            tune.Recoil_KickBack = backup.Recoil_KickBack
            tune.Recoil_Range = backup.Recoil_Range
            if backup.RPM then
                tune.RPM = backup.RPM
            end
            if backup.Firemodes then
                tune.Firemodes = backup.Firemodes
            end
            if backup.Bolt_Action_Pause then
                tune.Bolt_Action_Pause = backup.Bolt_Action_Pause
            end
            if backup.Bolt_Action_Shell then
                tune.Bolt_Action_Shell = backup.Bolt_Action_Shell
            end
            if backup.Config_Bolt_Action_Pause and tune.Parent then
                pcall(function() tune.Parent.Bolt_Action_Pause = backup.Config_Bolt_Action_Pause end)
            end
            if backup.Config_Bolt_Action_Shell and tune.Parent then
                pcall(function() tune.Parent.Bolt_Action_Shell = backup.Config_Bolt_Action_Shell end)
            end
        end)
    end
    table.clear(OriginalWeaponConfigs)

    -- Restore turrets config
    for config, backup in pairs(OriginalTurretConfigs) do
        pcall(function()
            config.RPM = backup.RPM
            config.Recoil_Base = backup.Recoil_Base
            config.Recoil_Range = backup.Recoil_Range
            config.Recoil_Camera = backup.Recoil_Camera
            config.Recoil_Kick = backup.Recoil_Kick
        end)
    end
    table.clear(OriginalTurretConfigs)

    -- Restore Bullet Hook
    if BulletTable then
        pcall(function()
            if OriginalBulletGetInfo then
                BulletTable.GetInfo = OriginalBulletGetInfo
            end
            if OriginalDischarge then
                BulletTable.Discharge = OriginalDischarge
            end
        end)
    end
end

-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | BLACKHAWK RESCUE MISSION 5",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ 1. MAIN TAB ]] --
local Tab1 = Window:AddTab({ Title = "info", Icon = "info", SubDescription = "Script Information" })

local DevPanel = Tab1:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer", "LilYouDev1997x")
DevPanel:AddInfoLabel("คำแนะนำ", "ฟังก์ชันเกี่ยวกับปืนไม่สามารถใช้กับตัวรันระดับต่ำได้\nหากพบปัญหาการใช้งาน กรุณาติดต่อแอดมินทาง Discord!")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- [[ 2. COMBAT TAB ]] --
local Tab2 = Window:AddTab({ Title = "Combat", Icon = "sword", SubDescription = "Battle & Skills" })
local CombatPanel = Tab2:AddPanel("Combat Configuration")

CombatPanel:AddToggle({
    Title = "Enable Aimbot",
    Description = "ทำการล็อกเป้าผู้เล่นหรือบอทที่อยู่ในระยะ",
    Default = false,
    Callback = function(v) Config.Combat.Aimbot = v end
})

CombatPanel:AddToggle({
    Title = "Wall Check",
    Description = "ล็อกเป้าเฉพาะศัตรูที่มองเห็นได้ (ไม่โดนบัง)",
    Default = false,
    Callback = function(v) Config.Combat.WallCheck = v end
})

CombatPanel:AddSlider({
    Title = "Aimbot Smoothness",
    Description = "ตั้งค่าความนิ่งในการล็อกเป้า",
    Min = 0,
    Max = 1,
    Default = 0.0,
    Rounding = 1,
    Callback = function(v) Config.Combat.Smoothness = v end
})

CombatPanel:AddToggle({
    Title = "Show FOV Circle",
    Description = "แสดงวงกลมเล็งเป้าบนหน้าจอ",
    Default = false,
    Callback = function(v) Config.Combat.ShowFOV = v end
})

CombatPanel:AddSlider({
    Title = "FOV Radius",
    Description = "ปรับเปลี่ยนขนาดของวงกลมล็อกเป้า",
    Min = 10,
    Max = 500,
    Default = 10,
    Rounding = 0,
    Callback = function(v) Config.Combat.FOV = v end
})

CombatPanel:AddSection("Weapon Modifications")

CombatPanel:AddToggle({
    Title = "No Recoil",
    Description = "ลดแรงดีดของปืนทั้งหมดเป็น 0",
    Default = false,
    Callback = function(v) Config.Combat.NoRecoil = v end
})

CombatPanel:AddToggle({
    Title = "Fast Fire (x2 RPM)",
    Description = "เพิ่มอัตราการยิงของปืนขึ้นเป็น 2 เท่า",
    Default = false,
    Callback = function(v) Config.Combat.FastFire = v end
})

CombatPanel:AddToggle({
    Title = "Turret Fast Fire",
    Description = "เพิ่มอัตราการยิงของป้อมปืนติดยานพาหนะเป็น 2 เท่า",
    Default = false,
    Callback = function(v) Config.Combat.TurretFastFire = v end
})



CombatPanel:AddToggle({
    Title = "Unlock Fire Modes",
    Description = "ปลดล็อกโหมดการยิงทั้งหมด (Semi, Burst, Auto)",
    Default = false,
    Callback = function(v) Config.Combat.UnlockFiremodes = v end
})

CombatPanel:AddToggle({
    Title = "No Bolt Action",
    Description = "เอาดีเลย์ดึงลูกเลื่อนสไนเปอร์ออก (ดึงลูกเลื่อนทันที)",
    Default = false,
    Callback = function(v) Config.Combat.NoBoltAction = v end
})




-- [[ 3. VISUALS TAB ]] --
local Tab3 = Window:AddTab({ Title = "Visuals", Icon = "eye", SubDescription = "ESP & Aesthetics" })
local VisualsPanel = Tab3:AddPanel("ESP & Visuals Configuration")

VisualsPanel:AddToggle({
    Title = "Enable ESP",
    Description = "เปิด/ปิดระบบมองทะลุทั้งหมด",
    Default = false,
    Callback = function(v) Config.Visuals.EspEnabled = v end
})

VisualsPanel:AddDropdown({
    Title = "ESP Type",
    Description = "เลือกแสดง ESP สำหรับ Bot, Player หรือ Bot + Player",
    Values = {"Bot", "Player", "Bot + Player"},
    Default = Config.Visuals.ESPType,
    Callback = function(Option) Config.Visuals.ESPType = Option end
})

VisualsPanel:AddDropdown({
    Title = "ESP Mode",
    Description = "เลือกโหมดแสดงผล ESP (Chams, Corner Box, Both)",
    Values = {"Chams", "Corner Box", "Both"},
    Default = Config.Visuals.ESPMode,
    Callback = function(Option) Config.Visuals.ESPMode = Option end
})

VisualsPanel:AddToggle({
    Title = "Show Distance",
    Description = "แสดงระยะห่างด้านล่างกรอบ ESP (เช่น 33M)",
    Default = true,
    Callback = function(v) Config.Visuals.ShowDistance = v end
})

VisualsPanel:AddSlider({
    Title = "Max ESP Distance",
    Description = "ระยะทางสูงสุดในการแสดงผล ESP (เมตร)",
    Min = 50,
    Max = 3000,
    Default = Config.Visuals.EspDistance,
    Rounding = 0,
    Callback = function(v) Config.Visuals.EspDistance = v end
})

VisualsPanel:AddToggle({
    Title = "Show Tracer Lines",
    Description = "แสดงเส้นชี้ไปยังตำแหน่งเป้าหมาย",
    Default = false,
    Callback = function(v) Config.Visuals.ShowTracers = v end
})

VisualsPanel:AddColorPicker({
    Title = "Player Color",
    Description = "ปรับเปลี่ยนสี ESP ของผู้เล่นจริง",
    Default = Config.Visuals.PlayerColor,
    Callback = function(v) Config.Visuals.PlayerColor = v end
})

VisualsPanel:AddColorPicker({
    Title = "Bot Color",
    Description = "ปรับเปลี่ยนสี ESP ของบอทศัตรู (AI)",
    Default = Config.Visuals.BotColor,
    Callback = function(v) Config.Visuals.BotColor = v end
})

VisualsPanel:AddColorPicker({
    Title = "Tracer Color",
    Description = "ปรับเปลี่ยนสีของเส้นชี้เป้า (Tracer)",
    Default = Config.Visuals.TracerColor,
    Callback = function(v) Config.Visuals.TracerColor = v end
})

VisualsPanel:AddSection("Environment")

VisualsPanel:AddToggle({
    Title = "Full Bright",
    Description = "เพิ่มความสว่างเเละลบเงา",
    Default = false,
    Callback = function(v) Config.Visuals.FullBright = v end
})

VisualsPanel:AddToggle({
    Title = "No Fog & Effects",
    Description = "ลบเอฟเฟคต่างๆเเละหมอก",
    Default = false,
    Callback = function(v) Config.Visuals.NoFog = v end
})

VisualsPanel:AddToggle({
    Title = "Clean NVG (No Mask & Noise)",
    Description = "ลบกรอบวงกลมเเละสัญญาณ Noise ออกจากกล้อง Night Vision",
    Default = false,
    Callback = function(v) Config.Visuals.CleanNVG = v end
})


-- [[ 5. SETTINGS TAB ]] --
local Tab6 = Window:AddTab({ Title = "Settings", Icon = "settings", SubDescription = "UI & Config" })



local ConfigPanel = Tab6:AddPanel("UI Management")
ConfigPanel:AddButton({
    Title = "Destroy UI",
    Description = "ปิดการทำงานของเมนู",
    Callback = function()
        Cleanup()
        Window:Destroy()
    end
})

local function GetClosestTarget()
    local nearest = nil
    local shortestDistance = Config.Combat.FOV
    local cam = workspace.CurrentCamera -- Fresh camera fetch
    
    -- Optimized: Use the pre-scanned Highlights table to avoid workspace:GetDescendants() lag
    for model, _ in pairs(Highlights) do
        if model and model.Parent then
            -- Verify target is alive if it has a Humanoid
            local humanoid = model:FindFirstChildOfClass("Humanoid")
            if not humanoid or humanoid.Health > 0 then
                -- Prioritize Head over Root/Default torso parts
                local targetPart = model:FindFirstChild("Head") or model:FindFirstChild("Default") or model:FindFirstChild("Root") or model.PrimaryPart
                
                if targetPart and targetPart:IsA("BasePart") then
                    local isVisible = true
                    if Config.Combat.WallCheck then
                        local origin = cam.CFrame.Position
                        local targetPos = targetPart.Position
                        local direction = targetPos - origin
                        
                        local raycastParams = RaycastParams.new()
                        raycastParams.FilterType = Enum.RaycastFilterType.Exclude
                        local exclude = {LocalPlayer.Character, model}
                        raycastParams.FilterDescendantsInstances = exclude
                        
                        local raycastResult = workspace:Raycast(origin, direction, raycastParams)
                        if raycastResult then
                            isVisible = false
                        end
                    end

                    if isVisible then
                        local screenPos, onScreen = cam:WorldToViewportPoint(targetPart.Position)
                        if onScreen then
                            local mouseDistance = (Vector2.new(screenPos.X, screenPos.Y) - UserInputService:GetMouseLocation()).Magnitude
                            if mouseDistance < shortestDistance then
                                shortestDistance = mouseDistance
                                nearest = targetPart
                            end
                        end
                    end
                end
            end
        end
    end
    return nearest
end

-- [[ LOGIC: AIMBOT EXECUTION (STICKY MOUSE EMULATION) ]] --
local LockedTarget = nil

RunService:BindToRenderStep("OSX_Aimbot", 2000, function()
    local cam = workspace.CurrentCamera
    local isRMBPressed = UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton2)
    local targetFound = nil
    
    if Config.Combat.Aimbot then
        if isRMBPressed then
            -- Sticky Logic: Check if target is still valid (exists, parented, and alive)
            if LockedTarget and LockedTarget.Parent then
                local humanoid = LockedTarget.Parent:FindFirstChildOfClass("Humanoid")
                local isVisible = true
                if Config.Combat.WallCheck and LockedTarget:IsA("BasePart") then
                    local origin = cam.CFrame.Position
                    local targetPos = LockedTarget.Position
                    local direction = targetPos - origin
                    
                    local raycastParams = RaycastParams.new()
                    raycastParams.FilterType = Enum.RaycastFilterType.Exclude
                    local exclude = {LocalPlayer.Character, LockedTarget.Parent}
                    raycastParams.FilterDescendantsInstances = exclude
                    
                    local raycastResult = workspace:Raycast(origin, direction, raycastParams)
                    if raycastResult then
                        isVisible = false
                    end
                end

                if (humanoid and humanoid.Health <= 0) or not isVisible then
                    LockedTarget = nil
                else
                    targetFound = LockedTarget
                end
            end
            
            if not targetFound then
                targetFound = GetClosestTarget()
                LockedTarget = targetFound
            end

            -- Execute Aim
            if targetFound then
                local targetPos, onScreen = cam:WorldToViewportPoint(targetFound.Position)
                if onScreen then
                    local mouseLocation = UserInputService:GetMouseLocation()
                    
                    -- Calculate deltas. Use a direct, aggressive delta multiplication to lock instantly and hold tight.
                    local lerpFactor = 1 - Config.Combat.Smoothness
                    -- If smoothness is low, we lock even harder. We increase response scaling.
                    local deltaX = (targetPos.X - mouseLocation.X) * lerpFactor
                    local deltaY = (targetPos.Y - mouseLocation.Y) * lerpFactor

                    if Config.Combat.Smoothness == 0 then
                        if mousemoverel then
                            mousemoverel(deltaX, deltaY)
                        end
                        local lookAt = CFrame.lookAt(cam.CFrame.Position, targetFound.Position)
                        cam.CFrame = lookAt
                    else
                        if mousemoverel then
                            -- Multiple small movements or scaling delta helps keep lock tight on fast moving targets
                            mousemoverel(deltaX, deltaY)
                        else
                            local lookAt = CFrame.lookAt(cam.CFrame.Position, targetFound.Position)
                            cam.CFrame = cam.CFrame:Lerp(lookAt, lerpFactor)
                        end
                    end
                else
                    -- If target goes off-screen, break the lock so it can re-acquire
                    LockedTarget = nil
                end
            end
        else
            -- Reset lock when button released
            LockedTarget = nil
            targetFound = nil
        end
    end

    -- Update FOV Circle Visuals
    if FOVCircle then
        FOVCircle.Visible = Config.Combat.ShowFOV and Config.Combat.Aimbot
        FOVCircle.Radius = Config.Combat.FOV
        FOVCircle.Position = UserInputService:GetMouseLocation()
        
        -- Visual Feedback: Turn RED when locking on
        if targetFound and isRMBPressed then
            FOVCircle.Color = Color3.new(1, 0, 0) -- RED
            FOVCircle.Thickness = 2.5 -- Thicker when locked
        else
            FOVCircle.Color = Color3.new(1, 1, 1) -- WHITE
            FOVCircle.Thickness = 1.5
        end
    end
end)

-- [[ LOGIC: HELPERS & TARGET VERIFICATION ]] --
local function IsBot(model)
    if not model then return false end
    for _, child in ipairs(model:GetChildren()) do
        if child.Name:sub(1, 3) == "AI_" then
            return true
        end
    end
    return false
end

local function IsDead(model)
    if not model or not model.Parent then return true end
    if model:FindFirstChildOfClass("BallSocketConstraint") or model:FindFirstChildOfClass("HingeConstraint") then
        return true
    end
    local hum = model:FindFirstChildOfClass("Humanoid")
    if hum and (hum.Health <= 0 or hum:GetState() == Enum.HumanoidStateType.Dead) then
        return true
    end
    return false
end

local function IsValidTargetModel(obj)
    if not obj or not obj:IsA("Model") then return false end
    if obj.Name ~= "Male" then return false end
    if obj == LocalPlayer.Character or (LocalPlayer.Character and obj:IsDescendantOf(LocalPlayer.Character)) then
        return false
    end

    local humanoid = obj:FindFirstChildOfClass("Humanoid")
    if not humanoid then return false end

    return true
end

local function GetActualHealth(model)
    if not model or not model.Parent then return 0, 100 end
    if IsDead(model) then return 0, 100 end

    local humanoid = model:FindFirstChildOfClass("Humanoid")
    if not humanoid then return 0, 100 end

    return humanoid.Health, (humanoid.MaxHealth > 0 and humanoid.MaxHealth or 100)
end

-- [[ LOGIC: 2D BOX & ESP DRAWINGS ]] --
local function CreateEspDrawing(model)
    if EspDrawings[model] then return EspDrawings[model] end

    local lines = {}
    for i = 1, 8 do
        local line = Drawing.new("Line")
        line.Thickness = 1.5
        line.Color = Config.Visuals.ChamsColor or Color3.fromRGB(255, 255, 255)
        line.Transparency = 1
        line.Visible = false
        lines[i] = line
    end

    local hpBg = Drawing.new("Line")
    hpBg.Thickness = 4
    hpBg.Color = Color3.fromRGB(30, 30, 30)
    hpBg.Transparency = 0.7
    hpBg.Visible = false

    local hpFg = Drawing.new("Line")
    hpFg.Thickness = 2
    hpFg.Color = Color3.fromRGB(0, 255, 0)
    hpFg.Transparency = 1
    hpFg.Visible = false

    local distText = Drawing.new("Text")
    distText.Size = 13
    distText.Center = true
    distText.Outline = true
    distText.OutlineColor = Color3.fromRGB(0, 0, 0)
    distText.Color = Color3.fromRGB(220, 220, 220)
    distText.Visible = false

    local tracerLine = Drawing.new("Line")
    tracerLine.Thickness = 1.5
    tracerLine.Color = Config.Visuals.ChamsColor or Color3.fromRGB(255, 255, 255)
    tracerLine.Transparency = 1
    tracerLine.Visible = false

    local data = {
        Lines = lines,
        HpBg = hpBg,
        HpFg = hpFg,
        Dist = distText,
        Tracer = tracerLine
    }

    EspDrawings[model] = data
    return data
end

local function HideEspDrawing(data)
    if not data then return end
    for _, l in ipairs(data.Lines) do l.Visible = false end
    data.HpBg.Visible = false
    data.HpFg.Visible = false
    data.Dist.Visible = false
    if data.Tracer then data.Tracer.Visible = false end
end

local function DestroyEspDrawing(model)
    local data = EspDrawings[model]
    if data then
        for _, l in ipairs(data.Lines) do pcall(function() l:Remove() end) end
        pcall(function() data.HpBg:Remove() end)
        pcall(function() data.HpFg:Remove() end)
        pcall(function() data.Dist:Remove() end)
        if data.Tracer then pcall(function() data.Tracer:Remove() end) end
        EspDrawings[model] = nil
    end
end

local function GetActualHealth(model)
    if not model then return 0, 100 end

    local humanoid = model:FindFirstChildOfClass("Humanoid")

    -- 1. Check Ragdoll / Physics / Dead State
    if humanoid then
        local state = humanoid:GetState()
        if state == Enum.HumanoidStateType.Dead or state == Enum.HumanoidStateType.Physics then
            return 0, 100
        end
        if humanoid.PlatformStand then
            return 0, 100
        end
    end

    if model:FindFirstChild("RagdollConstraint") or model:FindFirstChild("Ragdoll") or model:FindFirstChild("BallSocketConstraint") or model:FindFirstChild("Corpse") then
        return 0, 100
    end

    if model:GetAttribute("Ragdolled") == true or model:GetAttribute("Dead") == true or model:GetAttribute("Downed") == true or model:GetAttribute("Killed") == true or model:GetAttribute("IsDead") == true then
        return 0, 100
    end

    -- 2. Check Model / Humanoid Attributes
    for _, attr in ipairs({"Health", "HP", "CurrentHealth", "HealthValue", "Vitality"}) do
        local val = model:GetAttribute(attr) or (humanoid and humanoid:GetAttribute(attr))
        if val and tonumber(val) then
            local maxVal = model:GetAttribute("MaxHealth") or model:GetAttribute("MaxHP") or (humanoid and humanoid:GetAttribute("MaxHealth")) or 100
            return tonumber(val), tonumber(maxVal) or 100
        end
    end

    -- 3. Check Value Objects in Model or Sub-folders (Stats, Values, Health, Vitals, Config, Status)
    local targetContainers = {model}
    for _, folderName in ipairs({"Stats", "Values", "Health", "Vitals", "Config", "Status", "Attributes", "Character"}) do
        local f = model:FindFirstChild(folderName)
        if f then table.insert(targetContainers, f) end
    end

    for _, container in ipairs(targetContainers) do
        for _, name in ipairs({"Health", "HP", "CurrentHealth", "HealthValue", "Vitality"}) do
            local valObj = container:FindFirstChild(name)
            if valObj then
                if valObj:IsA("ValueBase") then
                    local maxObj = container:FindFirstChild("MaxHealth") or container:FindFirstChild("MaxHP")
                    local maxVal = maxObj and maxObj:IsA("ValueBase") and tonumber(maxObj.Value) or 100
                    return tonumber(valObj.Value) or 0, maxVal
                elseif valObj:IsA("Folder") or valObj:IsA("Model") then
                    -- Sum limb health if stored in folder
                    local totalHp = 0
                    local totalMax = 0
                    for _, limb in ipairs(valObj:GetChildren()) do
                        if limb:IsA("ValueBase") and tonumber(limb.Value) then
                            totalHp = totalHp + tonumber(limb.Value)
                            local lMax = limb:FindFirstChild("Max") or limb:GetAttribute("Max")
                            totalMax = totalMax + (lMax and tonumber(lMax.Value or lMax) or 100)
                        end
                    end
                    if totalHp > 0 then
                        return totalHp, (totalMax > 0 and totalMax or 100)
                    end
                end
            end
        end
    end

    -- 4. Check Overhead GUI / BillboardGui inside Model or Head
    local billboard = model:FindFirstChildOfClass("BillboardGui") or (model:FindFirstChild("Head") and model.Head:FindFirstChildOfClass("BillboardGui"))
    if billboard then
        for _, desc in ipairs(billboard:GetDescendants()) do
            if desc:IsA("TextLabel") and desc.Text ~= "" then
                local hpCur, hpMax = desc.Text:match("(%d+)%s*/%s*(%d+)")
                if hpCur and hpMax then
                    return tonumber(hpCur), tonumber(hpMax)
                end
                local hpSingle = desc.Text:match("HP:%s*(%d+)") or desc.Text:match("(%d+)%%")
                if hpSingle then
                    return tonumber(hpSingle), 100
                end
            elseif desc:IsA("Frame") and (desc.Name:lower():find("health") or desc.Name:lower():find("bar") or desc.Name:lower():find("fill")) then
                if desc.Size.X.Scale > 0 and desc.Size.X.Scale <= 1 then
                    return desc.Size.X.Scale * 100, 100
                end
            end
        end
    end

    -- 5. Standard Humanoid Health fallback
    if humanoid then
        local hp = humanoid.Health
        local maxHp = humanoid.MaxHealth > 0 and humanoid.MaxHealth or 100
        if hp <= 0 then
            return 0, maxHp
        end
        return hp, maxHp
    end

    return 100, 100
end

local function Update2DEsp(model)
    local isEspOn = Config.Visuals.EspEnabled
    local mode = Config.Visuals.ESPMode
    local showBox = isEspOn and (mode == "Corner Box" or mode == "Both")

    if not showBox or IsDead(model) then
        if EspDrawings[model] then HideEspDrawing(EspDrawings[model]) end
        return
    end

    local isBot = IsBot(model)
    local espType = Config.Visuals.ESPType or "Bot + Player"
    local shouldShow = false

    if espType == "Bot + Player" then
        shouldShow = true
    elseif espType == "Bot" and isBot then
        shouldShow = true
    elseif espType == "Player" and not isBot then
        shouldShow = true
    end

    if not shouldShow then
        if EspDrawings[model] then HideEspDrawing(EspDrawings[model]) end
        return
    end

    if not model or not model.Parent then
        DestroyEspDrawing(model)
        return
    end

    local humanoid = model:FindFirstChildOfClass("Humanoid")
    local primaryPart = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Head") or model.PrimaryPart

    if not primaryPart then
        if EspDrawings[model] then HideEspDrawing(EspDrawings[model]) end
        return
    end

    local head = model:FindFirstChild("Head") or primaryPart
    local root = model:FindFirstChild("HumanoidRootPart") or primaryPart

    local topWorld = head.Position + Vector3.new(0, 1.8, 0)
    local bottomWorld = root.Position - Vector3.new(0, 3.2, 0)

    local topScreen, topOnScreen = Camera:WorldToViewportPoint(topWorld)
    local bottomScreen, bottomOnScreen = Camera:WorldToViewportPoint(bottomWorld)

    if not (topOnScreen and bottomOnScreen) then
        if EspDrawings[model] then HideEspDrawing(EspDrawings[model]) end
        return
    end

    local height = math.abs(topScreen.Y - bottomScreen.Y)
    local width = height * 0.55
    local x = topScreen.X - (width / 2)
    local y = topScreen.Y

    local cornerLen = math.clamp(width * 0.25, 4, 15)

    local data = CreateEspDrawing(model)
    local lines = data.Lines
    local color = isBot and (Config.Visuals.BotColor or Color3.fromRGB(255, 255, 255)) or (Config.Visuals.PlayerColor or Color3.fromRGB(255, 255, 255))

    -- Top-Left Corner (┌)
    lines[1].From = Vector2.new(x, y); lines[1].To = Vector2.new(x + cornerLen, y)
    lines[1].Color = color; lines[1].Visible = true
    lines[2].From = Vector2.new(x, y); lines[2].To = Vector2.new(x, y + cornerLen)
    lines[2].Color = color; lines[2].Visible = true

    -- Top-Right Corner (┐)
    lines[3].From = Vector2.new(x + width, y); lines[3].To = Vector2.new(x + width - cornerLen, y)
    lines[3].Color = color; lines[3].Visible = true
    lines[4].From = Vector2.new(x + width, y); lines[4].To = Vector2.new(x + width, y + cornerLen)
    lines[4].Color = color; lines[4].Visible = true

    -- Bottom-Left Corner (└)
    lines[5].From = Vector2.new(x, y + height); lines[5].To = Vector2.new(x + cornerLen, y + height)
    lines[5].Color = color; lines[5].Visible = true
    lines[6].From = Vector2.new(x, y + height); lines[6].To = Vector2.new(x, y + height - cornerLen)
    lines[6].Color = color; lines[6].Visible = true

    -- Bottom-Right Corner (┘)
    lines[7].From = Vector2.new(x + width, y + height); lines[7].To = Vector2.new(x + width - cornerLen, y + height)
    lines[7].Color = color; lines[7].Visible = true
    lines[8].From = Vector2.new(x + width, y + height); lines[8].To = Vector2.new(x + width, y + height - cornerLen)
    lines[8].Color = color; lines[8].Visible = true

    -- Distance Text (Bottom e.g. "33M")
    if Config.Visuals.ShowDistance then
        local distMeters = math.floor((primaryPart.Position - Camera.CFrame.Position).Magnitude)
        data.Dist.Text = tostring(distMeters) .. "M"
        data.Dist.Position = Vector2.new(x + (width / 2), y + height + 2)
        data.Dist.Color = color
        data.Dist.Visible = true
    else
        data.Dist.Visible = false
    end

    -- Tracer Line (Snapline from bottom screen center to target box)
    if Config.Visuals.ShowTracers then
        local viewSize = Camera.ViewportSize
        data.Tracer.From = Vector2.new(viewSize.X / 2, viewSize.Y)
        data.Tracer.To = Vector2.new(x + (width / 2), y + height)
        data.Tracer.Color = Config.Visuals.TracerColor or Color3.fromRGB(255, 255, 255)
        data.Tracer.Visible = true
    else
        if data.Tracer then data.Tracer.Visible = false end
    end
end

-- [[ LOGIC: VISUALS ]] --
local function CreateHighlight(obj)
    if obj:IsA("Model") and obj.Name == "Male" and not Highlights[obj] then
        local h = Instance.new("Highlight")
        h.Name = "OSX_Chams"
        h.FillColor = Config.Visuals.ChamsColor
        h.OutlineColor = Color3.new(1, 1, 1)
        h.FillTransparency = 0.5
        h.OutlineTransparency = 0
        h.Adornee = obj
        h.Parent = obj
        h.Enabled = Config.Visuals.EspEnabled and (Config.Visuals.ESPMode == "Chams" or Config.Visuals.ESPMode == "Both")
        Highlights[obj] = h
    end
end

task.spawn(function()
    while IsRunning do
        if Config.Visuals.EspEnabled or Config.Combat.Aimbot then
            for _, v in ipairs(workspace:GetDescendants()) do
                CreateHighlight(v)
            end
        end
        task.wait(3)
    end
end)

DescendantAddedConnection = workspace.DescendantAdded:Connect(function(v)
    if Config.Visuals.EspEnabled or Config.Combat.Aimbot then
        CreateHighlight(v)
    end
end)

local function UpdateVisuals()
    local isEspOn = Config.Visuals.EspEnabled
    local mode = Config.Visuals.ESPMode
    local maxDist = Config.Visuals.EspDistance or 1000

    -- Sync Chams & 2D Box ESP
    for model, h in pairs(Highlights) do
        if not model or not model.Parent then
            pcall(function() h:Destroy() end)
            DestroyEspDrawing(model)
            Highlights[model] = nil
        else
            local primaryPart = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Head") or model.PrimaryPart
            local distMeters = primaryPart and (primaryPart.Position - Camera.CFrame.Position).Magnitude or 999999
            local inRange = distMeters <= maxDist

            local isBot = IsBot(model)
            local espType = Config.Visuals.ESPType or "Bot + Player"
            local shouldShow = false

            if espType == "Bot + Player" then
                shouldShow = true
            elseif espType == "Bot" and isBot then
                shouldShow = true
            elseif espType == "Player" and not isBot then
                shouldShow = true
            end

            local showChams = isEspOn and inRange and shouldShow and not IsDead(model) and (mode == "Chams" or mode == "Both")

            h.Enabled = showChams
            h.FillColor = isBot and (Config.Visuals.BotColor or Color3.fromRGB(255, 255, 255)) or (Config.Visuals.PlayerColor or Color3.fromRGB(255, 255, 255))

            if isEspOn and inRange and shouldShow and not IsDead(model) then
                Update2DEsp(model)
            else
                if EspDrawings[model] then
                    HideEspDrawing(EspDrawings[model])
                end
            end
        end
    end

    -- Full Bright Enforcement
    if Config.Visuals.FullBright then
        Lighting.Brightness = 2; Lighting.ClockTime = 14; Lighting.GlobalShadows = false; Lighting.OutdoorAmbient = Color3.new(1, 1, 1); Lighting.Ambient = Color3.new(1, 1, 1)
    else
        Lighting.Brightness = OriginalLighting.Brightness; Lighting.ClockTime = OriginalLighting.ClockTime
        Lighting.GlobalShadows = OriginalLighting.GlobalShadows; Lighting.OutdoorAmbient = OriginalLighting.OutdoorAmbient; Lighting.Ambient = OriginalLighting.Ambient
    end

    -- No Fog Enforcement
    if Config.Visuals.NoFog then
        Lighting.FogStart = 9e9
        Lighting.FogEnd = 9e9
        for _, parent in ipairs({Lighting, workspace.CurrentCamera}) do
            if parent then
                for _, v in ipairs(parent:GetChildren()) do
                    if v:IsA("Atmosphere") then
                        v.Density = 0
                        v.Haze = 0
                    elseif v:IsA("PostProcessEffect") then
                        v.Enabled = false
                    end
                end
            end
        end
    else
        Lighting.FogStart = OriginalLighting.FogStart
        Lighting.FogEnd = OriginalLighting.FogEnd
        for effect, state in pairs(OriginalEffects) do
            if effect.Parent then
                if effect:IsA("Atmosphere") then
                    effect.Density = state.Density
                    effect.Haze = state.Haze
                else
                    effect.Enabled = state
                end
            end
        end
    end

    -- Clean NVG Enforcement (Remove 3-circle dark frame & static noise)
    if Config.Visuals.CleanNVG then
        pcall(function()
            local nvgGui = LocalPlayer.PlayerGui:FindFirstChild("NVGInterface")
            if nvgGui then
                for _, desc in ipairs(nvgGui:GetDescendants()) do
                    if desc.Name == "Overlay" or desc.Name == "Static" then
                        desc.Visible = false
                    elseif desc:IsA("ImageLabel") and (desc.Name == "1" or desc.Name == "2" or desc.Name == "3") then
                        desc.Visible = false
                    end
                end
            end
        end)
    end
end

VisualsConnection = RunService.Heartbeat:Connect(UpdateVisuals)

-- [[ LOGIC: WEAPON MODIFICATION LOOP ]] --
local SharedConfigs = game:GetService("ReplicatedStorage"):FindFirstChild("Shared") 
    and game:GetService("ReplicatedStorage").Shared:FindFirstChild("Configs")

local WeaponsFolder = SharedConfigs and SharedConfigs:FindFirstChild("Weapon")
local TurretsModule = SharedConfigs and SharedConfigs:FindFirstChild("Turrets")

task.spawn(function()
    while IsRunning do
        -- Weapons Modification
        if WeaponsFolder then
            for _, module in ipairs(WeaponsFolder:GetDescendants()) do
                if module:IsA("ModuleScript") then
                    local success, config = pcall(function() return require(module) end)
                    if success and config and config.Config and config.Config.Tune then
                        local tune = config.Config.Tune
                        
                        -- Backup original values once
                        if not OriginalWeaponConfigs[tune] then
                            OriginalWeaponConfigs[tune] = {
                                Recoil_X = tune.Recoil_X,
                                Recoil_Z = tune.Recoil_Z,
                                RecoilForce_Tap = tune.RecoilForce_Tap,
                                RecoilForce_Impulse = tune.RecoilForce_Impulse,
                                Recoil_Camera = tune.Recoil_Camera,
                                Recoil_KickBack = tune.Recoil_KickBack,
                                Recoil_Range = tune.Recoil_Range,
                                RPM = tune.RPM,
                                Firemodes = tune.Firemodes,
                                Bolt_Action_Pause = tune.Bolt_Action_Pause,
                                Bolt_Action_Shell = tune.Bolt_Action_Shell,
                                Config_Bolt_Action_Pause = config.Config and config.Config.Bolt_Action_Pause,
                                Config_Bolt_Action_Shell = config.Config and config.Config.Bolt_Action_Shell
                            }
                        end
                        
                        local backup = OriginalWeaponConfigs[tune]
                        
                        -- Apply No Recoil Config
                        if Config.Combat.NoRecoil then
                            tune.Recoil_X = 0
                            tune.Recoil_Z = 0
                            tune.RecoilForce_Tap = 0
                            tune.RecoilForce_Impulse = 0
                            tune.Recoil_Camera = 0
                            tune.Recoil_KickBack = 0
                            if typeof(tune.Recoil_Range) == "Vector2" then
                                tune.Recoil_Range = Vector2.new(0, 0)
                            end
                        else
                            tune.Recoil_X = backup.Recoil_X
                            tune.Recoil_Z = backup.Recoil_Z
                            tune.RecoilForce_Tap = backup.RecoilForce_Tap
                            tune.RecoilForce_Impulse = backup.RecoilForce_Impulse
                            tune.Recoil_Camera = backup.Recoil_Camera
                            tune.Recoil_KickBack = backup.Recoil_KickBack
                            tune.Recoil_Range = backup.Recoil_Range
                        end

                        -- Apply Fast Fire Config
                        if backup.RPM then
                            if Config.Combat.FastFire then
                                tune.RPM = backup.RPM * 2
                            else
                                tune.RPM = backup.RPM
                            end
                        end

                        -- Apply Unlock Fire Modes Config
                        if Config.Combat.UnlockFiremodes then
                            if type(tune.Firemodes) == "table" then
                                local hasStrings = false
                                for _, mode in ipairs(tune.Firemodes) do
                                    if type(mode) == "string" then
                                        hasStrings = true
                                        break
                                    end
                                end
                                if hasStrings then
                                    tune.Firemodes = { "Semi", "Burst", "Auto" }
                                else
                                    tune.Firemodes = { 1, 2, 3 }
                                end
                            end
                        else
                            tune.Firemodes = backup.Firemodes
                        end

                        -- Apply No Bolt Action Config
                        if Config.Combat.NoBoltAction then
                            if tune.Bolt_Action_Pause then
                                tune.Bolt_Action_Pause = 0
                            end
                            if tune.Bolt_Action_Shell then
                                tune.Bolt_Action_Shell = 0
                            end
                            if config.Config then
                                if config.Config.Bolt_Action_Pause then
                                    config.Config.Bolt_Action_Pause = 0
                                end
                                if config.Config.Bolt_Action_Shell then
                                    config.Config.Bolt_Action_Shell = 0
                                end
                            end
                        else
                            tune.Bolt_Action_Pause = backup.Bolt_Action_Pause
                            tune.Bolt_Action_Shell = backup.Bolt_Action_Shell
                            if config.Config then
                                config.Config.Bolt_Action_Pause = backup.Config_Bolt_Action_Pause
                                config.Config.Bolt_Action_Shell = backup.Config_Bolt_Action_Shell
                            end
                        end
                    end
                end
            end
        end

        -- Turrets Modification (Vehicle Fast Fire)
        if TurretsModule and TurretsModule:IsA("ModuleScript") then
            local success, turretConfigs = pcall(function() return require(TurretsModule) end)
            if success and turretConfigs then
                for _, config in pairs(turretConfigs) do
                    if type(config) == "table" then
                        -- Backup original values once
                        if not OriginalTurretConfigs[config] then
                            OriginalTurretConfigs[config] = {
                                RPM = config.RPM,
                                Recoil_Base = config.Recoil_Base,
                                Recoil_Range = config.Recoil_Range,
                                Recoil_Camera = config.Recoil_Camera,
                                Recoil_Kick = config.Recoil_Kick
                            }
                        end

                        local backup = OriginalTurretConfigs[config]

                        -- Apply No Recoil Config to Turrets
                        if Config.Combat.NoRecoil then
                            if typeof(config.Recoil_Base) == "Vector2" then
                                config.Recoil_Base = Vector2.new(0, 0)
                            end
                            if typeof(config.Recoil_Range) == "Vector2" then
                                config.Recoil_Range = Vector2.new(0, 0)
                            end
                            config.Recoil_Camera = 0
                            config.Recoil_Kick = 0
                        else
                            config.Recoil_Base = backup.Recoil_Base
                            config.Recoil_Range = backup.Recoil_Range
                            config.Recoil_Camera = backup.Recoil_Camera
                            config.Recoil_Kick = backup.Recoil_Kick
                        end

                        -- Apply Turret Fast Fire Config
                        if backup.RPM then
                            if Config.Combat.TurretFastFire then
                                config.RPM = backup.RPM * 2
                            else
                                config.RPM = backup.RPM
                            end
                        end
                    end
                end
            end
        end

        task.wait(1)
    end
end)

-- [[ LOGIC: BULLET MODIFICATION ]] --
local function RedirectBulletDirection(origin, direction)
    if Config.Combat.HitRedirect then
        local targetPart = GetClosestTarget()
        if targetPart then
            return (targetPart.Position - origin).Unit * direction.Magnitude
        end
    end
    return direction
end

task.spawn(function()
    for _, v in pairs(getgc(true)) do
        if type(v) == "table" and rawget(v, "GetInfo") and rawget(v, "Discharge") then
            BulletTable = v
            OriginalBulletGetInfo = v.GetInfo
            OriginalDischarge = v.Discharge
            
            v.GetInfo = function(self, caliberName, attachment)
                local velocity, dropoff, range = OriginalBulletGetInfo(self, caliberName, attachment)
                if Config.Combat.InstantHit then
                    return 999999, dropoff, range
                end
                return velocity, dropoff, range
            end

            v.Discharge = function(self, origin, direction, ...)
                direction = RedirectBulletDirection(origin, direction)
                return OriginalDischarge(self, origin, direction, ...)
            end
            
            break
        end
    end
end)

-- [[ STARTUP ]] --
OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})
