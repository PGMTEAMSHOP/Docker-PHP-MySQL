-- =========================================================================================
-- OSX HUB | Violence District | Refactored & Stabilized
-- Made by: LilYouDev1997 | Discord: discord.gg/osxhub
-- =========================================================================================

-- Load OSX UI Library
local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

-- [ Section 1: Services ]
local Players             = game:GetService("Players")
local RunService          = game:GetService("RunService")
local ReplicatedStorage   = game:GetService("ReplicatedStorage")
local VirtualInputManager = game:GetService("VirtualInputManager")
local UserInputService    = game:GetService("UserInputService")
local GuiService          = game:GetService("GuiService")
local Lighting            = game:GetService("Lighting")
local CoreGui             = game:GetService("CoreGui")
local Stats               = game:GetService("Stats")
local localPlayer         = Players.LocalPlayer

-- [ Section 2: Global Configuration & Flags ]
local _G_AutoSkillCheck = false
local _G_GenESP = false
local _G_PalletsESP = false
local _G_WindowsESP = false
local _G_HookESP = false
local _G_GateESP = false
local _G_SCPEsp = false
local _G_FullBright = false
local _G_PlayerESP = false
local _G_PlayerNames = true
local _G_CFrameSpeed = false
local _G_CFrameSpeedValue = 0.05
local _G_NoClip = false
local _G_CustomFOV = false
local _G_FOVValue = 100
local _G_FirstPerson = false
local _G_HitboxExpander = false
local _G_HitboxSize = 15
local _G_Aimbot = false
local _G_AimbotPart = "Torso"
local _G_AimbotTrigger = "Hold to Lock"
local _G_AimbotSmoothness = 8
local _G_AimRadius = 60
local _G_AimDistance = 90
local _G_AimWallCheck = true
local _G_ShowAimRadius = false
local _G_AutoParry = false
local _G_ParryDistance = 10
local _G_ParryDelay = 0
local _G_ParryBurst = 6
local _G_ParryMatchup = "Auto"
local _G_AutoAttack = false
local _G_AttackRange = 10

local isScanning = { Pallets = false, Gens = false, Windows = false, Hooks = false, Gates = false }
local cachedFolders = {}
local FogCache = {}
local LightCache = {}
local SCPCache = {}
local SCPConnection = nil
local ESP_COLORS = {
    Killer = Color3.fromRGB(255, 93, 108),
    Survivor = Color3.fromRGB(0, 255, 34),
    Generator = Color3.fromRGB(200, 100, 0),
    GeneratorMid = Color3.fromRGB(255, 140, 0),
    GeneratorDone = Color3.fromRGB(0, 255, 120),
    Gate = Color3.fromRGB(255, 255, 255),
    Pallet = Color3.fromRGB(53, 189, 166),
    Hook = Color3.fromRGB(252, 116, 116),
    Window = Color3.fromRGB(0, 255, 255),
    SCP = Color3.fromRGB(170, 0, 255)
}
local HeartbeatConn = nil
local cframeConn = nil
local LastParryTime = 0
local LastSkillHit = 0
local LastGoalRotation = 0
local LastSkillTrigger = 0
local LastTargetCheck = 0
local LastParryTick = 0
local CachedTarget = nil
local ExactParryRemote = nil
local FOVCircle = nil
local CachedBasicAttack = nil
local SearchedAttackRemote = false
local LastAttackStrike = 0
local GeneratorPerfectOffsetStart = 102
local GeneratorPerfectOffsetEnd = 108

-- [ Section 3: UI Detection (Safe & Non-Blocking) ]
local PG = localPlayer:WaitForChild("PlayerGui")
local CheckGui, Check, Line, Goal

task.spawn(function()
    CheckGui = PG:FindFirstChild("SkillCheckPromptGui") or PG:WaitForChild("SkillCheckPromptGui", 10)
    if CheckGui then
        Check = CheckGui:FindFirstChild("Check") or CheckGui:WaitForChild("Check", 5)
        if Check then
            Line = Check:FindFirstChild("Line")
            Goal = Check:FindFirstChild("Goal")
        end
    end
end)

-- [ Section 4: Helper Functions ]

-- Caching Folder Helper
local function GetTargetFolder(name)
    local lowerName = name:lower()
    if cachedFolders[lowerName] and cachedFolders[lowerName].Parent then return cachedFolders[lowerName] end
    
    local mapFolder = nil
    for _, v in pairs(workspace:GetChildren()) do
        if v.Name:lower() == "map" then mapFolder = v break end
    end
    
    if lowerName == "map" then cachedFolders[lowerName] = mapFolder return mapFolder end
    
    if mapFolder then
        local common = mapFolder:FindFirstChild(name, true)
        if common and (common:IsA("Folder") or common:IsA("Model")) then
            cachedFolders[lowerName] = common
            return common
        end
    end
    
    for _, v in pairs(workspace:GetDescendants()) do
        if v.Name:lower() == lowerName and (v:IsA("Folder") or v:IsA("Model")) then
            cachedFolders[lowerName] = v
            return v
        end
    end
    return nil
end

local function GetGameValue(obj, name)
    if not obj then return nil end

    local attr = obj:GetAttribute(name)
    if attr ~= nil then return attr end

    local child = obj:FindFirstChild(name, true)
    if child and child:IsA("ValueBase") then
        return child.Value
    end

    return nil
end

local function ApplyHighlight(object, color, name)
    if not object then return end

    local highlightName = name or "OSX_Highlight"
    local highlight = object:FindFirstChild(highlightName)
    if not highlight then
        highlight = Instance.new("Highlight")
        highlight.Name = highlightName
        highlight.Adornee = object
        highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
        highlight.FillTransparency = 0.82
        highlight.OutlineTransparency = 0.03
        highlight.Parent = object
    end

    highlight.FillColor = color
    highlight.OutlineColor = color:Lerp(Color3.new(1, 1, 1), 0.15)
    highlight.Enabled = true
    return highlight
end

local function RemoveHighlight(object, name)
    if not object then return end

    local highlightName = name or "OSX_Highlight"
    local highlight = object:FindFirstChild(highlightName)
    if highlight then highlight:Destroy() end
end

local function updateGeneratorProgress(generator)
    if not generator or not generator.Parent then return true end

    local percent = GetGameValue(generator, "RepairProgress") or GetGameValue(generator, "Progress") or 0
    local billboard = generator:FindFirstChild("OSX_Generator_Progress")

    if percent >= 100 or not _G_GenESP then
        if billboard then billboard:Destroy() end
        RemoveHighlight(generator, "OSX_Gen_Highlight")
        return percent >= 100
    end

    local cp = math.clamp(percent, 0, 100)
    local finalColor = cp < 50
        and ESP_COLORS.Generator:Lerp(ESP_COLORS.GeneratorMid, cp / 50)
        or ESP_COLORS.GeneratorMid:Lerp(ESP_COLORS.GeneratorDone, (cp - 50) / 50)

    ApplyHighlight(generator, finalColor, "OSX_Gen_Highlight")

    local targetPart = generator:FindFirstChild("RootPart", true)
        or generator:FindFirstChild("HitBox", true)
        or generator.PrimaryPart
        or generator:FindFirstChildWhichIsA("BasePart", true)
    if not targetPart then return false end

    if not billboard then
        billboard = Instance.new("BillboardGui")
        billboard.Name = "OSX_Generator_Progress"
        billboard.Adornee = targetPart
        billboard.AlwaysOnTop = true
        billboard.LightInfluence = 0
        billboard.ResetOnSpawn = false
        billboard.MaxDistance = 350
        billboard.Size = UDim2.new(0, 125, 0, 24)
        billboard.StudsOffset = Vector3.new(0, 3.2, 0)
        billboard.Parent = generator

        local label = Instance.new("TextLabel")
        label.Name = "Label"
        label.BackgroundTransparency = 1
        label.Size = UDim2.fromScale(1, 1)
        label.Font = Enum.Font.GothamBold
        label.TextSize = 8
        label.TextXAlignment = Enum.TextXAlignment.Center
        label.TextYAlignment = Enum.TextYAlignment.Center
        label.Parent = billboard

        local stroke = Instance.new("UIStroke")
        stroke.Thickness = 1
        stroke.Transparency = 0.2
        stroke.Color = Color3.new(0, 0, 0)
        stroke.Parent = label
    end

    billboard.Adornee = targetPart
    local label = billboard:FindFirstChild("Label")
    if label then
        label.Text = string.format("%.1f%%", math.floor(cp * 10) / 10)
        label.TextColor3 = finalColor
    end

    return false
end

-- Fog Management
local function SetFog(Value)
    if Value then
        pcall(function()
            local map = GetTargetFolder("Map") or workspace
            for _, obj in ipairs(map:GetDescendants()) do
                if obj.Name:lower():find("fog") or obj:IsA("Atmosphere") or obj:IsA("BloomEffect") or obj:IsA("BlurEffect") or obj:IsA("ColorCorrectionEffect") then
                    if not FogCache[obj] then
                        FogCache[obj] = {enabled = obj:IsA("PostEffect") and obj.Enabled or true, parent = obj.Parent, density = obj:IsA("Atmosphere") and obj.Density or nil}
                    end
                    if obj:IsA("PostEffect") then obj.Enabled = false else obj.Parent = nil end
                end
            end
            local lighting = game:GetService("Lighting")
            for _, obj in ipairs(lighting:GetChildren()) do
                if obj:IsA("Atmosphere") or obj.Name:lower():find("fog") then
                    if not FogCache[obj] then FogCache[obj] = {enabled = true, parent = obj.Parent, density = obj:IsA("Atmosphere") and obj.Density or nil} end
                    if obj:IsA("Atmosphere") then obj.Density = 0 else obj.Parent = nil end
                end
            end
            lighting.FogEnd, lighting.FogStart = 100000, 0
        end)
    else
        pcall(function()
            for obj, data in pairs(FogCache) do
                if obj then
                    if obj:IsA("PostEffect") then obj.Enabled = data.enabled
                    else obj.Parent = data.parent if obj:IsA("Atmosphere") and data.density then obj.Density = data.density end end
                end
            end
            FogCache = {}
            game:GetService("Lighting").FogEnd = 1000
        end)
    end
end

-- Full Bright Management
local function SetFullBright(Value)
    local Lighting = game:GetService("Lighting")
    if Value then
        LightCache.Brightness = Lighting.Brightness
        LightCache.ClockTime = Lighting.ClockTime
        LightCache.FogEnd = Lighting.FogEnd
        LightCache.GlobalShadows = Lighting.GlobalShadows
        LightCache.Ambient = Lighting.Ambient
        LightCache.OutdoorAmbient = Lighting.OutdoorAmbient

        Lighting.Brightness = 2
        Lighting.ClockTime = 14
        Lighting.FogEnd = 100000
        Lighting.GlobalShadows = false
        Lighting.Ambient = Color3.fromRGB(255, 255, 255)
        Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
    else
        if LightCache.Brightness then
            Lighting.Brightness = LightCache.Brightness
            Lighting.ClockTime = LightCache.ClockTime
            Lighting.FogEnd = LightCache.FogEnd
            Lighting.GlobalShadows = LightCache.GlobalShadows
            Lighting.Ambient = LightCache.Ambient
            Lighting.OutdoorAmbient = LightCache.OutdoorAmbient
        end
    end
end

-- ESP Management
local function RunESPScan(type)
    if isScanning[type] then return end
    isScanning[type] = true
    pcall(function()
        local root = GetTargetFolder("Map") or workspace
        local hlName, color, reqPart
        local potentialNames = {}

        if type == "Pallets" then
            potentialNames, reqPart, hlName, color = {"Pallet", "Palletwrong"}, "HumanoidRootPart", "OSX_Pallet_Highlight", ESP_COLORS.Pallet
        elseif type == "Gens" then
            potentialNames, reqPart, hlName, color = {"Generator"}, "HitBox", "OSX_Gen_Highlight", ESP_COLORS.Generator
        elseif type == "Windows" then
            potentialNames, reqPart, hlName, color = {"Window", "Vault"}, "Bottom", "OSX_Window_Highlight", ESP_COLORS.Window
        elseif type == "Hooks" then
            potentialNames, reqPart, hlName, color = {"Hook"}, "HitBox", "OSX_Hook_Highlight", ESP_COLORS.Hook
        elseif type == "Gates" then
            potentialNames, reqPart, hlName, color = {"Gate", "ExitGate", "Exit Gate"}, "HitBox", "OSX_Gate_Highlight", ESP_COLORS.Gate
        end
        
        local items = root:GetDescendants()
        for i, v in pairs(items) do
            if (type == "Pallets" and not _G_PalletsESP)
                or (type == "Gens" and not _G_GenESP)
                or (type == "Windows" and not _G_WindowsESP)
                or (type == "Hooks" and not _G_HookESP)
                or (type == "Gates" and not _G_GateESP) then
                break
            end
            local isMatch = false
            for _, name in pairs(potentialNames) do if v.Name == name then isMatch = true break end end

            if isMatch and v:IsA("Model") then
                local targetPart = v:FindFirstChild(reqPart, true) or v.PrimaryPart or v:FindFirstChildWhichIsA("BasePart", true)
                if type == "Gens" then
                    updateGeneratorProgress(v)
                elseif targetPart then
                    if type == "Windows" then
                        local adornment = targetPart:FindFirstChild(hlName)
                        if not adornment then
                            adornment = Instance.new("BoxHandleAdornment")
                            adornment.Name, adornment.Size, adornment.AlwaysOnTop, adornment.ZIndex, adornment.Transparency, adornment.Color3, adornment.Adornee, adornment.Parent = hlName, targetPart.Size + Vector3.new(0.05, 0.05, 0.05), true, 5, 0.5, color, targetPart, targetPart
                        end
                    else
                        ApplyHighlight(v, color, hlName)
                    end
                end
            end
            if i % 100 == 0 then task.wait() end
        end
    end)
    isScanning[type] = false
end

-- Player ESP
local function ApplyPlayerESP(player)
    if player == localPlayer then return end
    local function UpdateHighlight()
        local char = player.Character
        if not char then return end
        local root = char:FindFirstChild("HumanoidRootPart")
        local hum = char:FindFirstChildOfClass("Humanoid")
        local highlight = char:FindFirstChild("OSX_Player_Highlight")
        local tag = root and root:FindFirstChild("OSX_Player_Tag")

        if _G_PlayerESP then
            local team = player.Team
            local isKiller = team and team.Name and team.Name:lower():find("killer")
            local color = isKiller and ESP_COLORS.Killer or ESP_COLORS.Survivor
            local status = nil

            if hum and hum.Health > 0 and hum.MaxHealth > 0 and hum.Health < hum.MaxHealth then
                status = "INJURED"
                color = Color3.fromRGB(255, 225, 80)
            end
            if GetGameValue(char, "IsHooked") or GetGameValue(player, "IsHooked") then
                status = "HOOKED"
                color = Color3.fromRGB(255, 70, 140)
            elseif GetGameValue(char, "Knocked") or GetGameValue(char, "IsKnocked") then
                status = "KNOCKED"
                color = Color3.fromRGB(255, 170, 0)
            end

            ApplyHighlight(char, color, "OSX_Player_Highlight")

            if _G_PlayerNames and root then
                if not tag then
                    tag = Instance.new("BillboardGui")
                    tag.Name = "OSX_Player_Tag"
                    tag.Adornee = root
                    tag.AlwaysOnTop = true
                    tag.LightInfluence = 0
                    tag.ResetOnSpawn = false
                    tag.MaxDistance = 1800
                    tag.Size = UDim2.new(0, 165, 0, 34)
                    tag.StudsOffset = Vector3.new(0, 3.8, 0)
                    tag.Parent = root

                    local label = Instance.new("TextLabel")
                    label.Name = "Label"
                    label.BackgroundTransparency = 1
                    label.Size = UDim2.fromScale(1, 1)
                    label.RichText = true
                    label.TextScaled = false
                    label.TextWrapped = false
                    label.Font = Enum.Font.GothamBold
                    label.TextSize = 8
                    label.TextXAlignment = Enum.TextXAlignment.Center
                    label.TextYAlignment = Enum.TextYAlignment.Center
                    label.Parent = tag

                    local stroke = Instance.new("UIStroke")
                    stroke.Thickness = 1.2
                    stroke.Transparency = 0.2
                    stroke.Color = Color3.new(0, 0, 0)
                    stroke.Parent = label
                end

                local myRoot = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
                local dist = myRoot and math.floor((root.Position - myRoot.Position).Magnitude) or 0
                local label = tag:FindFirstChild("Label")
                if label then
                    local suffix = status and string.format(" | %s", status) or ""
                    label.Text = string.format("<b>@%s</b>\n%dm%s", player.Name, dist, suffix)
                    label.TextColor3 = color
                end
            elseif tag then
                tag:Destroy()
            end
        else
            if highlight then highlight:Destroy() end
            if tag then tag:Destroy() end
        end
    end
    UpdateHighlight()
    player:GetPropertyChangedSignal("Team"):Connect(UpdateHighlight)
    player.CharacterAdded:Connect(function() task.wait(0.5) UpdateHighlight() end)
end

-- [ Section 5: Combat & Automation Functions ]

-- Generator Skill Check Logic (ported from the working VDVIP generator module)
local function ForceGeneratorUnstuck()
    local char = localPlayer.Character
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    local root = char and char:FindFirstChild("HumanoidRootPart")
    if not (char and hum and root) then return end

    for _, track in ipairs(hum:GetPlayingAnimationTracks()) do
        local anim = track.Animation
        local name = ((anim and anim.Name) or ""):lower()
        if name:find("repair") or name:find("generator") or name:find("fix") or name:find("interaction") then
            pcall(function() track:Stop(0) end)
        end
    end

    for _, stateName in ipairs({ "Repairing", "IsRepairing", "Interacting", "Busy", "Action", "Using" }) do
        pcall(function()
            if char:GetAttribute(stateName) ~= nil then
                char:SetAttribute(stateName, false)
            end

            local obj = char:FindFirstChild(stateName)
            if obj and obj:IsA("ValueBase") then
                if typeof(obj.Value) == "boolean" then
                    obj.Value = false
                elseif typeof(obj.Value) == "number" then
                    obj.Value = 0
                end
            end
        end)
    end

    root.Anchored = false
    hum.PlatformStand = false
    hum.AutoRotate = true
    hum.Sit = false
    hum:ChangeState(Enum.HumanoidStateType.Running)
end

local function PressGeneratorSkill()
    if tick() - LastSkillTrigger < 0.08 then return end
    LastSkillTrigger = tick()

    local PlayerGui = localPlayer:FindFirstChild("PlayerGui") or localPlayer:WaitForChild("PlayerGui")
    local isMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled

    if isMobile then
        local btn = PlayerGui:FindFirstChild("check", true)
        if btn and btn:IsA("GuiObject") then
            local pos = btn.AbsolutePosition
            local size = btn.AbsoluteSize
            local inset = GuiService:GetGuiInset()
            local x = pos.X + (size.X / 2) + inset.X
            local y = pos.Y + (size.Y / 2) + inset.Y

            pcall(function()
                VirtualInputManager:SendTouchEvent(8822, Enum.UserInputState.Begin.Value, x, y)
                task.wait()
                VirtualInputManager:SendTouchEvent(8822, Enum.UserInputState.End.Value, x, y)
            end)

            pcall(function()
                if firesignal and btn.MouseButton1Click then
                    firesignal(btn.MouseButton1Click)
                end
            end)
        end
    else
        pcall(function()
            VirtualInputManager:SendKeyEvent(true, Enum.KeyCode.Space, false, game)
            task.wait()
            VirtualInputManager:SendKeyEvent(false, Enum.KeyCode.Space, false, game)
        end)
    end
end

local function GetActiveSkillCheck()
    local PlayerGui = localPlayer:FindFirstChild("PlayerGui") or localPlayer:WaitForChild("PlayerGui")

    for _, guiName in ipairs({ "SkillCheckPromptGui", "SkillCheckPromptGui-con" }) do
        local gui = PlayerGui:FindFirstChild(guiName, true)
        if gui then
            local check = gui:FindFirstChild("Check", true)
            if check and check.Visible then
                local line = check:FindFirstChild("Line", true)
                local goal = check:FindFirstChild("Goal", true)
                if line and goal then
                    return line, goal
                end
            end
        end
    end
end

local function TriggerGeneratorAntiStuck()
    pcall(function()
        local char = workspace:FindFirstChild(localPlayer.Name) or localPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        local root = char and char:FindFirstChild("HumanoidRootPart")
        local cam = workspace.CurrentCamera

        pcall(function()
            local remotes = ReplicatedStorage:FindFirstChild("Remotes")
            local healing = remotes and remotes:FindFirstChild("Healing")
            local reset = healing and healing:FindFirstChild("Reset")
            if reset then reset:FireServer() end
        end)

        if hum and root then
            root.Anchored = false
            hum.PlatformStand = false
            hum.AutoRotate = true
            hum.Sit = false
            hum:ChangeState(Enum.HumanoidStateType.GettingUp)

            for _, track in ipairs(hum:GetPlayingAnimationTracks()) do
                pcall(function() track:Stop(0) end)
            end

            local map = workspace:FindFirstChild("Map")
            local genFolder = map and (map:FindFirstChild("new Generators") or map:FindFirstChild("Generators"))
            if genFolder then
                local nearestGen, nearestDist
                for _, gen in ipairs(genFolder:GetChildren()) do
                    local part = gen:FindFirstChildWhichIsA("BasePart", true)
                    if part then
                        local dist = (root.Position - part.Position).Magnitude
                        if not nearestDist or dist < nearestDist then
                            nearestDist = dist
                            nearestGen = part
                        end
                    end
                end

                if nearestGen and nearestDist <= 15 then
                    local dir = (root.Position - nearestGen.Position).Unit
                    local escapePos = root.Position + (dir * 20)
                    root.CFrame = CFrame.new(escapePos, escapePos + root.CFrame.LookVector)
                end
            end

            task.wait()
            hum:ChangeState(Enum.HumanoidStateType.Running)
            hum.Jump = true

            if cam and cam.CameraType ~= Enum.CameraType.Custom then
                cam.CameraType = Enum.CameraType.Custom
                cam.CameraSubject = hum
            end
        end

        OSX:Notify({ Title = "Auto Generator", Content = "Anti-Stuck triggered.", Duration = 3 })
    end)
end

local function StartSkillCheckLogic()
    if HeartbeatConn then
        HeartbeatConn:Disconnect()
        HeartbeatConn = nil
    end

    HeartbeatConn = RunService.Heartbeat:Connect(function()
        if not _G_AutoSkillCheck then return end

        local line, goal = GetActiveSkillCheck()
        if not (line and goal) then return end

        local lr = line.Rotation % 360
        local gr = goal.Rotation % 360
        local goalVelocity = math.abs(gr - LastGoalRotation)
        LastGoalRotation = gr
        local dynamicOffset = math.clamp(goalVelocity * 0.35, 0, 8)

        local startPos = (gr + GeneratorPerfectOffsetStart - dynamicOffset) % 360
        local endPos = (gr + GeneratorPerfectOffsetEnd + dynamicOffset) % 360
        local inside = (startPos > endPos)
            and (lr >= startPos or lr <= endPos)
            or (lr >= startPos and lr <= endPos)

        if inside then
            LastSkillHit = tick()
            PressGeneratorSkill()
        end
    end)

    task.spawn(function()
        while task.wait(0.25) do
            if _G_AutoSkillCheck then
                local line = GetActiveSkillCheck()
                if not line and tick() - LastSkillHit > 1.1 then
                    pcall(ForceGeneratorUnstuck)
                end
            end
        end
    end)
end
task.spawn(StartSkillCheckLogic)

-- Instant Win / Escape Logic
local function ApplyAutoWin()
    local team = localPlayer.Team
    if not team or not team.Name:lower():find("survivor") then return end
    
    local char = localPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    if not root then return end
    
    local map = GetTargetFolder("Map") or workspace:FindFirstChild("Map")
    if not map then return end
    
    local exitPos = nil
    pcall(function()
        -- Map Specific Exit Coordinates
        if map:FindFirstChild("RooftopHitbox") or map:FindFirstChild("Rooftop") then
            exitPos = Vector3.new(3098.16, 454.04, -4918.74)
        elseif map:FindFirstChild("HooksMeat") then
            exitPos = Vector3.new(1546.12, 152.21, -796.72)
        elseif map:FindFirstChild("churchbell") then
            exitPos = Vector3.new(760.98, -20.14, -78.48)
        else
            -- Search for Finishline
            local finish = map:FindFirstChild("Finishline") or map:FindFirstChild("FinishLine") or map:FindFirstChild("Fininshline")
            if finish then
                if finish:IsA("BasePart") then exitPos = finish.Position
                elseif finish:IsA("Model") then local part = finish:FindFirstChildWhichIsA("BasePart") if part then exitPos = part.Position end end
            end
            
            -- Broad Search for "finish"
            if not exitPos then
                for _, obj in ipairs(map:GetDescendants()) do
                    if obj.Name:lower():find("finish") then
                        if obj:IsA("BasePart") then exitPos = obj.Position break
                        elseif obj:IsA("Model") then local part = obj:FindFirstChildWhichIsA("BasePart") if part then exitPos = part.Position break end end
                    end
                end
            end
            
            -- Fallback by Material (specific map detection)
            if not exitPos then
                for _, obj in ipairs(map:GetDescendants()) do
                    if obj:IsA("MeshPart") and obj.Material == Enum.Material.Limestone then
                        exitPos = Vector3.new(-947.90, 152.12, -7579.52)
                        break
                    elseif obj:IsA("MeshPart") and obj.Material == Enum.Material.Leather then
                        exitPos = Vector3.new(1546.12, 152.21, -796.72)
                        break
                    end
                end
            end
        end
    end)
    
    if exitPos then
        root.CFrame = CFrame.new(exitPos + Vector3.new(0, 3, 0))
    end
end

local function IsSCP(model)
    if not (model and model:IsA("Model")) then return false end

    local name = model.Name:lower()
    return name == "scp"
        or name:match("^scp%d*$")
        or name:match("^scp[%-%_]?%d+$")
        or name:find("zombie")
        or name:find("monster")
        or name:find("infected")
        or name:find("mutant")
end

local function RemoveSCP(model)
    local highlight = SCPCache[model]
    if highlight then pcall(function() highlight:Destroy() end) end
    SCPCache[model] = nil
end

local function CreateSCP(model)
    if not _G_SCPEsp or SCPCache[model] or not IsSCP(model) then return end

    local root = model:FindFirstChild("HumanoidRootPart", true)
        or model.PrimaryPart
        or model:FindFirstChildWhichIsA("BasePart", true)
    if not root then return end

    local highlight = Instance.new("Highlight")
    highlight.Name = "OSX_SCP_Highlight"
    highlight.Adornee = model
    highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
    highlight.FillColor = ESP_COLORS.SCP
    highlight.OutlineColor = Color3.fromRGB(255, 220, 255)
    highlight.FillTransparency = 0.78
    highlight.OutlineTransparency = 0.03
    highlight.Parent = model
    SCPCache[model] = highlight

    model.AncestryChanged:Connect(function(_, parent)
        if not parent then RemoveSCP(model) end
    end)
end

local function ScanSCP()
    for _, obj in ipairs(workspace:GetChildren()) do
        if IsSCP(obj) then CreateSCP(obj) end
    end
end

local function ConnectSCP()
    if SCPConnection then SCPConnection:Disconnect() end
    SCPConnection = workspace.ChildAdded:Connect(function(obj)
        if not _G_SCPEsp or not obj:IsA("Model") then return end
        task.delay(0.15, function()
            if obj and obj.Parent then CreateSCP(obj) end
        end)
    end)
end

local function SwitchCameraMode(toFPP)
    _G_FirstPerson = toFPP
    if toFPP then
        localPlayer.CameraMode = Enum.CameraMode.LockFirstPerson
        localPlayer.CameraMinZoomDistance = 0.5
        localPlayer.CameraMaxZoomDistance = 0.5
    else
        localPlayer.CameraMode = Enum.CameraMode.Classic
        localPlayer.CameraMinZoomDistance = 0.5
        localPlayer.CameraMaxZoomDistance = 128
    end
end

local function RefreshHitboxes()
    for _, player in ipairs(Players:GetPlayers()) do
        if player ~= localPlayer and player.Character then
            local team = player.Team
            local isKiller = team and team.Name and team.Name:lower():find("killer")
            local root = player.Character:FindFirstChild("HumanoidRootPart")
            local hitbox = player.Character:FindFirstChild("OSX_Killer_Hitbox")

            if _G_HitboxExpander and isKiller and root then
                if not hitbox then
                    hitbox = Instance.new("Part")
                    hitbox.Name = "OSX_Killer_Hitbox"
                    hitbox.Anchored = false
                    hitbox.CanCollide = false
                    hitbox.Massless = true
                    hitbox.Transparency = 0.75
                    hitbox.Color = ESP_COLORS.Killer
                    hitbox.Material = Enum.Material.ForceField
                    hitbox.Parent = player.Character

                    local weld = Instance.new("WeldConstraint")
                    weld.Part0 = root
                    weld.Part1 = hitbox
                    weld.Parent = hitbox
                end
                hitbox.Size = Vector3.new(_G_HitboxSize, _G_HitboxSize, _G_HitboxSize)
                hitbox.CFrame = root.CFrame
            elseif hitbox then
                hitbox:Destroy()
            end
        end
    end
end

local IgnoreParrySkills = {
    Veil = true,
    Masked = true,
    Stalker = true,
    Invisible = true,
    Ghost = true,
    Phase = true,
    Dash = true,
    Warp = true,
    Teleport = true
}

local KillerProfiles = {
    Killer = { BonusDist = 1, Delay = 0.04 },
    Abysswalker = { BonusDist = 3.5, Delay = 0.12 },
    Hidden = { BonusDist = 2.2, Delay = 0 },
    Masked = { BonusDist = 1.5, Delay = 0.05 },
    Stalker = { BonusDist = 1.8, Delay = 0 },
    Veil = { BonusDist = 3.2, Delay = 0.04 },
    Slasher = { BonusDist = 1.2, Delay = 0.05 },
    Cure = { BonusDist = 2, Delay = 0.03 }
}

local function EnsureFOVCircle()
    if FOVCircle and FOVCircle.Parent then return FOVCircle end

    local parent = nil
    pcall(function() parent = CoreGui end)
    parent = parent or PG

    local gui = parent:FindFirstChild("OSX_Aim_Indicator") or Instance.new("ScreenGui")
    gui.Name = "OSX_Aim_Indicator"
    gui.IgnoreGuiInset = true
    gui.ResetOnSpawn = false
    gui.Parent = parent

    FOVCircle = gui:FindFirstChild("FOVCircle") or Instance.new("Frame")
    FOVCircle.Name = "FOVCircle"
    FOVCircle.AnchorPoint = Vector2.new(0.5, 0.5)
    FOVCircle.Position = UDim2.new(0.5, 0, 0.5, 0)
    FOVCircle.BackgroundTransparency = 1
    FOVCircle.Parent = gui

    if not FOVCircle:FindFirstChildOfClass("UICorner") then
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(1, 0)
        corner.Parent = FOVCircle
    end

    local stroke = FOVCircle:FindFirstChildOfClass("UIStroke") or Instance.new("UIStroke")
    stroke.Color = Color3.new(1, 1, 1)
    stroke.Transparency = 0.5
    stroke.Thickness = 1.5
    stroke.Parent = FOVCircle

    return FOVCircle
end

local function UpdateFOVCircle()
    local circle = EnsureFOVCircle()
    local radius = tonumber(_G_AimRadius) or 60
    circle.Size = UDim2.new(0, radius * 2, 0, radius * 2)
    circle.Visible = _G_ShowAimRadius
end

local function IsEnemyPlayer(player)
    if not player or player == localPlayer then return false end

    local myTeam = localPlayer.Team and localPlayer.Team.Name:lower() or ""
    local enemyTeam = player.Team and player.Team.Name:lower() or ""
    local iAmKiller = myTeam:find("killer") ~= nil
    local enemyIsKiller = enemyTeam:find("killer") ~= nil

    if iAmKiller then
        return not enemyIsKiller
    end

    return enemyIsKiller
end

local function GetAimPart(character)
    if not character then return nil end

    if _G_AimbotPart == "Head" then
        return character:FindFirstChild("Head")
    elseif _G_AimbotPart == "Body (RootPart)" then
        return character:FindFirstChild("HumanoidRootPart")
    end

    return character:FindFirstChild("UpperTorso")
        or character:FindFirstChild("Torso")
        or character:FindFirstChild("HumanoidRootPart")
        or character.PrimaryPart
end

local function IsVisible(targetPart)
    if not _G_AimWallCheck then return true end
    if not targetPart or not workspace.CurrentCamera then return false end

    local camera = workspace.CurrentCamera
    local origin = camera.CFrame.Position
    local direction = targetPart.Position - origin

    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Blacklist
    params.FilterDescendantsInstances = { camera, localPlayer.Character }

    local result = workspace:Raycast(origin, direction, params)
    return not result or result.Instance:IsDescendantOf(targetPart.Parent)
end

local function GetClosestPlayer(currentTarget)
    local camera = workspace.CurrentCamera
    if not camera then return nil end

    local center = camera.ViewportSize * 0.5
    local shortest = tonumber(_G_AimRadius) or 60
    local maxDistance = tonumber(_G_AimDistance) or 90
    local camPos = camera.CFrame.Position

    if currentTarget and currentTarget.Parent then
        local hum = currentTarget.Parent:FindFirstChildOfClass("Humanoid")
        local pos, visible = camera:WorldToViewportPoint(currentTarget.Position)
        local screenDist = (Vector2.new(pos.X, pos.Y) - center).Magnitude
        if hum and hum.Health > 0 and visible and screenDist <= shortest and IsVisible(currentTarget) then
            return currentTarget
        end
    end

    local closest = nil
    for _, player in ipairs(Players:GetPlayers()) do
        if IsEnemyPlayer(player) and player.Character then
            local character = player.Character
            local hum = character:FindFirstChildOfClass("Humanoid")
            local targetPart = GetAimPart(character)
            if hum and hum.Health > 0 and targetPart then
                local tooFar = (targetPart.Position - camPos).Magnitude > maxDistance
                local skipDowned = GetGameValue(character, "Knocked") or GetGameValue(character, "IsHooked")
                if not tooFar and not skipDowned then
                    local pos, visible = camera:WorldToViewportPoint(targetPart.Position)
                    if visible then
                        local screenDist = (Vector2.new(pos.X, pos.Y) - center).Magnitude
                        if screenDist < shortest and IsVisible(targetPart) then
                            shortest = screenDist
                            closest = targetPart
                        end
                    end
                end
            end
        end
    end

    return closest
end

local function GetParryRemote()
    if ExactParryRemote and ExactParryRemote.Parent then return ExactParryRemote end

    local remotes = ReplicatedStorage:FindFirstChild("Remotes")
    local items = remotes and remotes:FindFirstChild("Items")
    local dagger = items and items:FindFirstChild("Parrying Dagger")

    if dagger and dagger:FindFirstChild("parry") then
        ExactParryRemote = dagger.parry
    elseif remotes then
        for _, obj in ipairs(remotes:GetDescendants()) do
            if obj:IsA("RemoteEvent") and obj.Name:lower() == "parry" then
                ExactParryRemote = obj
                break
            end
        end
    end

    return ExactParryRemote
end

local function GetPing()
    local ping = 0.09
    pcall(function()
        ping = Stats.Network.ServerStatsItem["Data Ping"]:GetValue() / 1000
    end)
    return math.clamp(ping, 0.04, 0.22)
end

local function IsKillerUsingSkill(character)
    if not character then return false end

    for skill in pairs(IgnoreParrySkills) do
        if character:GetAttribute(skill) or GetGameValue(character, skill) then
            return true
        end
    end

    return false
end

local function GetKillerProfile(character)
    local selected = _G_ParryMatchup or "Auto"
    if selected ~= "Auto" then
        return KillerProfiles[selected] or { BonusDist = 1, Delay = 0 }
    end

    local detect = tostring(character and (character:GetAttribute("KillerType") or character:GetAttribute("Mask") or character.Name) or ""):lower()
    for profile in pairs(KillerProfiles) do
        if detect:find(profile:lower()) then
            return KillerProfiles[profile]
        end
    end

    return { BonusDist = 1, Delay = 0 }
end

local function TriggerParryDagger()
    local now = tick()
    if now - LastParryTick < 0.06 then return end

    local remote = GetParryRemote()
    local char = localPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    if not (remote and root and hum and hum.Health > 0) then return end
    if not (char:FindFirstChild("Parrying Dagger") or char:FindFirstChildWhichIsA("Tool")) then return end

    local ping = GetPing()
    local bestProfile = nil
    local bestDistance = math.huge

    for _, player in ipairs(Players:GetPlayers()) do
        if player ~= localPlayer and player.Team and player.Team.Name:lower():find("killer") and player.Character then
            local enemyChar = player.Character
            local enemyRoot = enemyChar:FindFirstChild("HumanoidRootPart")
            local enemyHum = enemyChar:FindFirstChildOfClass("Humanoid")
            if enemyRoot and enemyHum and enemyHum.Health > 0 and not IsKillerUsingSkill(enemyChar) then
                local profile = GetKillerProfile(enemyChar)
                local velocity = enemyRoot.AssemblyLinearVelocity
                if velocity.Magnitude > 32 then velocity = velocity.Unit * 32 end
                local predicted = enemyRoot.Position + velocity * (ping + 0.06)
                local distance = (predicted - root.Position).Magnitude
                local maxDist = (tonumber(_G_ParryDistance) or 10) + (profile.BonusDist or 0) + (ping * 10)
                if distance <= maxDist and distance < bestDistance then
                    bestDistance = distance
                    bestProfile = profile
                end
            end
        end
    end

    if not bestProfile then return end
    LastParryTick = now

    task.spawn(function()
        local delayTime = (bestProfile.Delay or 0) + (tonumber(_G_ParryDelay) or 0)
        if delayTime > 0 then task.wait(delayTime) end
        for _ = 1, math.max(1, tonumber(_G_ParryBurst) or 6) do
            if not _G_AutoParry or not remote.Parent then break end
            pcall(function() remote:FireServer() end)
            task.wait(0.008)
        end
    end)
end

local function TryAutoAttack()
    if not _G_AutoAttack then return end

    local char = localPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    local team = localPlayer.Team and localPlayer.Team.Name:lower() or ""
    if not (root and hum and hum.Health > 0 and team:find("killer")) then return end
    if GetGameValue(char, "Carrying") or GetGameValue(char, "IsCarrying") or GetGameValue(char, "Stunned") then return end

    local targetFound = false
    for _, player in ipairs(Players:GetPlayers()) do
        if player ~= localPlayer and player.Character then
            local enemyTeam = player.Team and player.Team.Name:lower() or ""
            local enemyRoot = player.Character:FindFirstChild("HumanoidRootPart")
            local enemyHum = player.Character:FindFirstChildOfClass("Humanoid")
            if enemyRoot and enemyHum and enemyHum.Health > 0 and not enemyTeam:find("killer") then
                local knocked = GetGameValue(player.Character, "Knocked") or GetGameValue(player.Character, "IsHooked")
                local range = (enemyHum.MoveDirection.Magnitude > 0) and ((_G_AttackRange or 10) + 3) or (_G_AttackRange or 10)
                if not knocked and (enemyRoot.Position - root.Position).Magnitude <= range then
                    targetFound = true
                    break
                end
            end
        end
    end

    local now = os.clock()
    if not targetFound or now - LastAttackStrike <= 0.6 then return end
    LastAttackStrike = now

    if not SearchedAttackRemote then
        local remotes = ReplicatedStorage:FindFirstChild("Remotes")
        local attacks = remotes and (remotes:FindFirstChild("Attacks") or remotes:FindFirstChild("attacks") or remotes:FindFirstChild("Attack"))
        CachedBasicAttack = attacks and (attacks:FindFirstChild("BasicAttack") or attacks:FindFirstChild("basicattack"))
        SearchedAttackRemote = true
    end

    if CachedBasicAttack then
        pcall(function()
            CachedBasicAttack:FireServer(false)
            task.wait(0.05)
            CachedBasicAttack:FireServer(true)
        end)
    end
end

local function UpdateAimbot(deltaTime)
    if not _G_Aimbot then
        CachedTarget = nil
        return
    end

    local camera = workspace.CurrentCamera
    if not camera then return end

    local now = time()
    if now - LastTargetCheck > 0.12 then
        CachedTarget = GetClosestPlayer(CachedTarget)
        LastTargetCheck = now
    end

    local target = CachedTarget
    if not (target and target.Parent and target:IsDescendantOf(workspace)) then
        CachedTarget = nil
        return
    end

    local firing = _G_AimbotTrigger == "Auto Lock (Always)"
    if not firing then
        firing = UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton1)
            or UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton2)
            or UserInputService:IsKeyDown(Enum.KeyCode.Q)
    end

    if firing then
        local smooth = math.clamp(deltaTime * (tonumber(_G_AimbotSmoothness) or 8), 0.08, 0.28)
        camera.CFrame = camera.CFrame:Lerp(CFrame.lookAt(camera.CFrame.Position, target.Position), smooth)
    end
end

-- [ Section 6: UI Construction ]

local success, productInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = success and productInfo and productInfo.Name or "Violence District"

local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- 1. Info Tab
local InfoTab = Window:AddTab({ Title = "Info", SubDescription = "Information", Icon = "info" })
local InfoPanel = InfoTab:AddPanel("Information")
InfoPanel:AddInfoLabel("Owner:", "Darkmxde.")
InfoPanel:AddInfoLabel("Developer Main:", "0b1100001cat")
InfoPanel:AddInfoLabel("Developer Backup:", "LilYouDev1997x")
InfoPanel:AddInfoLabel("Discord:", "https://discord.gg/osxhub")

InfoPanel:AddWideButton({ Title = "Discord Server", Description = "คัดลอกลิงก์ Discord", Callback = function() setclipboard("https://discord.gg/osxhub") OSX:Notify({ Title = "OSX HUB", Content = "คัดลอกสำเร็จ!", Duration = 3 }) end })

-- 2. Player Tab
local PlayerTab = Window:AddTab({ Title = "Player", SubDescription = "Movement Settings", Icon = "user" })
local PlayerPanel = PlayerTab:AddPanel("Movement Controls")
PlayerPanel:AddToggle({ 
    Title = "CFrame Speed", 
    Description = "เปิดระบบเดินเร็ว (CFrame Hack)", 
    Default = false, 
    Callback = function(V) 
        _G_CFrameSpeed = V 
        if cframeConn then cframeConn:Disconnect() cframeConn = nil end
        if V then
            cframeConn = RunService.RenderStepped:Connect(function(dt)
                local char = localPlayer.Character
                local root = char and char:FindFirstChild("HumanoidRootPart")
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                if root and hum and hum.MoveDirection.Magnitude > 0 then
                    root.CFrame = root.CFrame + (hum.MoveDirection * (_G_CFrameSpeedValue * 20 * dt))
                end
            end)
        end
    end 
})
PlayerPanel:AddSlider({ Title = "Speed Multiplier", Description = "ปรับความเร็วแบบละเอียด (0.01 - 3.00)", Min = 0.01, Max = 3, Default = 0.01, Rounding = 2, Callback = function(V) _G_CFrameSpeedValue = V end })
PlayerPanel:AddToggle({ 
    Title = "No Clip", 
    Description = "เดินทะลุกำแพงและสิ่งกีดขวาง", 
    Default = false, 
    Callback = function(V) 
        _G_NoClip = V 
        if not V then
            local char = localPlayer.Character
            if char then
                for _, part in ipairs(char:GetDescendants()) do
                    if part:IsA("BasePart") then part.CanCollide = true end
                end
            end
        end
    end 
})

local CameraPanel = PlayerTab:AddPanel("Camera Controls")
CameraPanel:AddToggle({
    Title = "First Person Camera",
    Description = "ปรับมุมมองเป็นบุคคลที่ 1",
    Default = false,
    Callback = function(V)
        SwitchCameraMode(V)
    end
})
CameraPanel:AddToggle({
    Title = "Custom FOV",
    Description = "ปรับความกว้างของมุมมอง",
    Default = false,
    Callback = function(V)
        _G_CustomFOV = V
        if not V and workspace.CurrentCamera then workspace.CurrentCamera.FieldOfView = 70 end
    end
})
CameraPanel:AddSlider({
    Title = "FOV Value",
    Description = "ปรับระดับความกว้างของมุมมอง",
    Min = 70,
    Max = 120,
    Default = 100,
    Rounding = 0,
    Callback = function(V)
        _G_FOVValue = tonumber(V) or 100
    end
})

-- 3. ESP Tab
local ESPTab = Window:AddTab({ Title = "ESP", SubDescription = "Visuals Settings", Icon = "eye" })
local ESPPanel = ESPTab:AddPanel("Visual Features")
ESPPanel:AddToggle({ Title = "Player ESP", Description = "แสดงออร่าผู้เล่น", Default = false, Callback = function(V) _G_PlayerESP = V for _, p in pairs(Players:GetPlayers()) do ApplyPlayerESP(p) end end })
ESPPanel:AddToggle({ Title = "Player Names", Description = "แสดงรายละเอียด ชื่อ ระยะห่าง และสถานะของผู้เล่น", Default = false, Callback = function(V) _G_PlayerNames = V for _, p in pairs(Players:GetPlayers()) do ApplyPlayerESP(p) end end })
ESPPanel:AddToggle({ Title = "Generator ESP", Description = "แสดงออร่าเครื่องปั่นไฟ", Default = false, Callback = function(V) _G_GenESP = V if V then task.spawn(function() RunESPScan("Gens") end) else for _, v in pairs(workspace:GetDescendants()) do if v.Name == "OSX_Gen_Highlight" then v:Destroy() end end end end })
ESPPanel:AddToggle({ Title = "Pallets ESP", Description = "แสดงออร่าไม้พาเลท", Default = false, Callback = function(V) _G_PalletsESP = V if V then task.spawn(function() RunESPScan("Pallets") end) else for _, v in pairs(workspace:GetDescendants()) do if v.Name == "OSX_Pallet_Highlight" then v:Destroy() end end end end })
ESPPanel:AddToggle({ Title = "Windows ESP", Description = "แสดงออร่าหน้าต่าง", Default = false, Callback = function(V) _G_WindowsESP = V if V then task.spawn(function() RunESPScan("Windows") end) else for _, v in pairs(workspace:GetDescendants()) do if v.Name == "OSX_Window_Highlight" then v:Destroy() end end end end })
ESPPanel:AddToggle({ Title = "Hook ESP", Description = "แสดงออร่าเสาแขวน", Default = false, Callback = function(V) _G_HookESP = V if V then task.spawn(function() RunESPScan("Hooks") end) else for _, v in pairs(workspace:GetDescendants()) do if v.Name == "OSX_Hook_Highlight" then v:Destroy() end end end end })
ESPPanel:AddToggle({ Title = "Exit Gate ESP", Description = "แสดงออร่าประตูทางออก", Default = false, Callback = function(V) _G_GateESP = V if V then task.spawn(function() RunESPScan("Gates") end) else for _, v in pairs(workspace:GetDescendants()) do if v.Name == "OSX_Gate_Highlight" then v:Destroy() end end end end })
--ESPPanel:AddToggle({ Title = "SCP / Zombie ESP", Description = "Show SCP, zombie, monster, infected and mutant models.", Default = false, Callback = function(V) _G_SCPEsp = V if V then ConnectSCP() ScanSCP() else for model in pairs(SCPCache) do RemoveSCP(model) end end end })
local EnvPanel = ESPTab:AddPanel("Environment Settings")
EnvPanel:AddToggle({ Title = "No Fog", Description = "ลบหมอกและเอฟเฟกต์เบลอสายตา", Default = false, Callback = function(V) SetFog(V) end })
EnvPanel:AddToggle({ Title = "Full Bright", Description = "เปิดแสงสว่างสูงสุด", Default = false, Callback = function(V) SetFullBright(V) end })

-- 4. Auto Tab
local AutoTab = Window:AddTab({ Title = "Auto", SubDescription = "Automation", Icon = "sword" })
local AutoPanel = AutoTab:AddPanel("Perfect Skill Check")
AutoPanel:AddToggle({
    Title = "Auto Perfect Skill Check",
    Description = "กด Space/Touch อัตโนมัติด้วยระบบปั่นไฟใหม่",
    Default = false,
    Callback = function(V)
        _G_AutoSkillCheck = V
        LastSkillHit = tick()
        OSX:Notify({
            Title = "Auto Generator",
            Content = V and "เปิดระบบปั่นไฟอัตโนมัติแล้ว" or "ปิดระบบปั่นไฟอัตโนมัติแล้ว",
            Duration = 3
        })
    end
})
AutoPanel:AddWideButton({
    Title = "Anti-Stuck Generator",
    Description = "ปลดตัวละครออกจาก state ปั่นไฟ/ค้างทันที",
    Callback = function()
        TriggerGeneratorAntiStuck()
    end
})

local WinPanel = AutoTab:AddPanel("Auto Escape | วาร์ปออกจากประตูเพื่อชนะทันที")

WinPanel:AddWideButton({
    Title = "Escape Instantly (Survivor)",
    Description = "วาร์ปออกจากประตูเพื่อชนะทันที ห้ามกดตอนเป็นฆาตกร!",
    Callback = function()
        ApplyAutoWin()
    end
})

local CombatTab = Window:AddTab({ Title = "Combat", SubDescription = "Target Helpers", Icon = "target" })

local AimPanel = CombatTab:AddPanel("Aimbot")
AimPanel:AddToggle({
    Title = "Aimbot",
    Description = "ล็อคเป้าไปที่ศัตรูที่อยู่ใกล้ที่สุดภายในรัศมีเป้าหมาย",
    Default = false,
    Callback = function(V)
        _G_Aimbot = V
        if not V then CachedTarget = nil end
    end
})
AimPanel:AddDropdown({
    Title = "Aimbot Target",
    Description = "เลือกส่วนที่ต้องการล๊อคเป้าหมาย.",
    Values = { "Torso", "Head", "Body (RootPart)" },
    Default = 1,
    Callback = function(V)
        _G_AimbotPart = V
        CachedTarget = nil
    end
})
AimPanel:AddDropdown({
    Title = "Aimbot Trigger",
    Description = "ปรับโหมดการล็อกระหว่าง กดค้าง หรือ ล็อกอัตโนมัติ",
    Values = { "Hold to Lock", "Auto Lock (Always)" },
    Default = 1,
    Callback = function(V)
        _G_AimbotTrigger = V
    end
})
AimPanel:AddSlider({
    Title = "Aim Radius",
    Description = "รัศมีในการล็อกเป้าหมาย",
    Min = 30,
    Max = 180,
    Default = 60,
    Rounding = 0,
    Callback = function(V)
        _G_AimRadius = tonumber(V) or 60
        UpdateFOVCircle()
    end
})
AimPanel:AddSlider({
    Title = "Aim Distance",
    Description = "ระยะห่างในการล็อกเป้าหมาย",
    Min = 30,
    Max = 220,
    Default = 90,
    Rounding = 0,
    Callback = function(V)
        _G_AimDistance = tonumber(V) or 90
    end
})
AimPanel:AddSlider({
    Title = "Aim Smoothness",
    Description = "ความสมูตในการล็อกเป้า",
    Min = 2,
    Max = 20,
    Default = 8,
    Rounding = 0,
    Callback = function(V)
        _G_AimbotSmoothness = tonumber(V) or 8
    end
})
AimPanel:AddToggle({
    Title = "Wall Check",
    Description = "ไม่ล็อกตัวหลังกำเเพงหรือตัวที่มองไม่เห็น",
    Default = true,
    Callback = function(V)
        _G_AimWallCheck = V
        CachedTarget = nil
    end
})
AimPanel:AddToggle({
    Title = "Show Aim Radius",
    Description = "วงกลมสีแดงในการมองเห็นเป้าหมาย",
    Default = false,
    Callback = function(V)
        _G_ShowAimRadius = V
        UpdateFOVCircle()
    end
})

local ParryPanel = CombatTab:AddPanel("Parry")
ParryPanel:AddToggle({
    Title = "Auto Parry",
    Description = "กด Parry อัตโนมัติเมื่อเจอฆาตกร",
    Default = false,
    Callback = function(V)
        _G_AutoParry = V
    end
})
ParryPanel:AddDropdown({
    Title = "Killer Matchup",
    Description = "เลือกตัวละครฆาตกร",
    Values = { "Auto", "Killer", "Abysswalker", "Hidden", "Masked", "Stalker", "Veil", "Slasher", "Cure" },
    Default = 1,
    Callback = function(V)
        _G_ParryMatchup = V
    end
})
ParryPanel:AddSlider({
    Title = "Parry Distance",
    Description = "ระยะห่างในการ Parry",
    Min = 4,
    Max = 24,
    Default = 10,
    Rounding = 0,
    Callback = function(V)
        _G_ParryDistance = tonumber(V) or 10
    end
})
ParryPanel:AddSlider({
    Title = "Parry Delay (ms)",
    Description = "หน่วงเวลาในการกด Parry",
    Min = 0,
    Max = 250,
    Default = 0,
    Rounding = 0,
    Callback = function(V)
        _G_ParryDelay = (tonumber(V) or 0) / 1000
    end
})
ParryPanel:AddSlider({
    Title = "Parry Burst",
    Description = "จำนวนครั้งในการกด Parry",
    Min = 1,
    Max = 12,
    Default = 6,
    Rounding = 0,
    Callback = function(V)
        _G_ParryBurst = tonumber(V) or 6
    end
})

local AttackPanel = CombatTab:AddPanel("Auto Attack")
AttackPanel:AddToggle({
    Title = "Auto Attack",
    Description = "ตีฆาตกรอัตโนมัติ",
    Default = false,
    Callback = function(V)
        _G_AutoAttack = V
    end
})
AttackPanel:AddSlider({
    Title = "Attack Range",
    Description = "ระยะห่างในการตีฆาตกร",
    Min = 4,
    Max = 20,
    Default = 10,
    Rounding = 0,
    Callback = function(V)
        _G_AttackRange = tonumber(V) or 10
    end
})

local HitboxPanel = CombatTab:AddPanel("Killer Hitbox")
HitboxPanel:AddToggle({
    Title = "Killer Hitbox",
    Description = "ขยาย Hitbox ฆาตกร",
    Default = false,
    Callback = function(V)
        _G_HitboxExpander = V
        if not V then
            for _, p in ipairs(Players:GetPlayers()) do
                if p.Character then
                    local hitbox = p.Character:FindFirstChild("OSX_Killer_Hitbox")
                    if hitbox then hitbox:Destroy() end
                end
            end
        end
    end
})
HitboxPanel:AddSlider({
    Title = "Hitbox Size",
    Description = "เพิ่ม Hitbox ฆาตกร",
    Min = 2,
    Max = 50,
    Default = 15,
    Rounding = 0,
    Callback = function(V)
        _G_HitboxSize = tonumber(V) or 15
    end
})

-- [ Section 7: Initialization & Connections ]

-- Background & Signals
-- CFrame Speed & No Clip
RunService.Stepped:Connect(function()
    if _G_NoClip then
        local char = localPlayer.Character
        if char then
            for _, part in ipairs(char:GetDescendants()) do
                if part:IsA("BasePart") then
                    part.CanCollide = false
                end
            end
        end
    end
end)

RunService.Heartbeat:Connect(function(deltaTime)
    if _G_CustomFOV and workspace.CurrentCamera then
        workspace.CurrentCamera.FieldOfView = _G_FOVValue
    end

    if _G_HitboxExpander then
        RefreshHitboxes()
    end

    UpdateFOVCircle()
    UpdateAimbot(deltaTime)

    if _G_AutoParry then
        pcall(TriggerParryDagger)
    end

    TryAutoAttack()
end)
task.spawn(function()
    while true do
        if _G_PlayerESP then for _, p in pairs(Players:GetPlayers()) do ApplyPlayerESP(p) end end
        task.wait(1)
        if _G_PalletsESP then task.spawn(function() RunESPScan("Pallets") end) end
        task.wait(2)
        if _G_GenESP then task.spawn(function() RunESPScan("Gens") end) end
        task.wait(2)
        if _G_WindowsESP then task.spawn(function() RunESPScan("Windows") end) end
        task.wait(2)
        if _G_HookESP then task.spawn(function() RunESPScan("Hooks") end) end
        task.wait(2)
        if _G_GateESP then task.spawn(function() RunESPScan("Gates") end) end
        if _G_SCPEsp then task.spawn(ScanSCP) end
        task.wait(10)
    end
end)

for _, p in pairs(Players:GetPlayers()) do ApplyPlayerESP(p) end
Players.PlayerAdded:Connect(ApplyPlayerESP)

print("OSX HUB | " .. GameName .. " Loaded Successfully")
