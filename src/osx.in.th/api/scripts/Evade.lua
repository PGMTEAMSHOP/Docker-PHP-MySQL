local GameName = "EVADE"
local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

-- Services
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TeleportService = game:GetService("TeleportService")
local VirtualUser = game:GetService("VirtualUser")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local localPlayer = Players.LocalPlayer

-- State Variables
local ValueSpeed = 1
local ActiveCFrameSpeedBoost = false
local cframeSpeedConnection = nil
local IsHoldingSpace = false
local bhopEnabled = false
local IsHoldingButton = false
local afk = true
local selectedMapNumber = 1
local autoVoteEnabled = false
local voteConnection = nil
local ActiveEspPlayers = false
local ActiveEspBots = false
local ActiveDistanceEsp = false
local playerAddedConnection = nil
local botLoopConnection = nil
local autoReviveEnabled = false
local lastCheckTime = 0
local checkInterval = 5
local InfiniteJump = false
local Noclip = false
local FastReviveEnabled = false
local teleportToReviveEnabled = false
local autoCarryEnabled = false
local autoExpFloatEnabled = false
local autoCollectTokenEnabled = false
local floatPlatform = nil
local lastPosBeforeFloat = nil
local invisibilityEnabled = false

local function getSafePos()
    local hrp = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
    local basePos = lastPosBeforeFloat and lastPosBeforeFloat.Position or (hrp and hrp.Position or Vector3.new(0,0,0))
    return Vector3.new(basePos.X, 1000, basePos.Z)
end

local function managePlatform(enable)
    if enable then
        if not floatPlatform or not floatPlatform.Parent then
            floatPlatform = Instance.new("Part")
            floatPlatform.Name = "OSX_FloatPlatform"
            floatPlatform.Size = Vector3.new(6, 1, 6) -- ปรับให้เล็กลงพอดีหนึ่งคนยืน
            floatPlatform.Transparency = 0.5 -- See-through but visible
            floatPlatform.Color = Color3.fromRGB(0, 170, 255)
            floatPlatform.Anchored = true
            floatPlatform.CanCollide = true
            floatPlatform.Parent = Workspace
        end
        floatPlatform.Position = getSafePos() - Vector3.new(0, 3.5, 0)
    else
        if floatPlatform then
            floatPlatform:Destroy()
            floatPlatform = nil
        end
    end
end

-- Lighting Originals
local originalBrightness = Lighting.Brightness
local originalOutdoorAmbient = Lighting.OutdoorAmbient
local originalAmbient = Lighting.Ambient
local originalGlobalShadows = Lighting.GlobalShadows
local originalFogEnd = Lighting.FogEnd
local originalFogStart = Lighting.FogStart
local ColorCorrection = Lighting:FindFirstChildOfClass("ColorCorrectionEffect") or Instance.new("ColorCorrectionEffect", Lighting)
local originalColorCorrectionEnabled = ColorCorrection.Enabled
local originalSaturation = ColorCorrection.Saturation
local originalContrast = ColorCorrection.Contrast

-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | Evade [🌊 ]",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})


local Tabs = {
    Info = Window:AddTab({ Title = "Info", SubDescription = "Information", Icon = "info" }),
    Main = Window:AddTab({ Title = "Player", Icon = "user", SubDescription = "Movement & Speed" }),
    Visuals = Window:AddTab({ Title = "Visuals", Icon = "eye", SubDescription = "ESP & Lighting" }),
    Auto = Window:AddTab({ Title = "Auto Play", Icon = "sword", SubDescription = "Voting & Revive" }),
    Farm = Window:AddTab({ Title = "Auto Farm", Icon = "star", SubDescription = "Money & EXP" }),
    Misc = Window:AddTab({ Title = "Misc", Icon = "component", SubDescription = "Optimization & AFK" })
    -- Settings = Window:AddTab({ Title = "Settings", Icon = "settings", SubDescription = "UI & Info" })
}

-- [[ Helper Functions ]]

local CharacterService
pcall(function()
    CharacterService = require(ReplicatedStorage.Services.Asset.CharacterService)
end)

local function isPlayerDowned(plr)
    if plr and plr.Character then
        local tag = plr.Character:GetAttribute("Tag")
        if tag and CharacterService then
            local success, charData = pcall(function()
                return CharacterService:GetCharacterFromTag(tag)
            end)
            if success and charData and charData.DataRegistry then
                local state = charData.DataRegistry:Get("State")
                if state == "Downed" then
                    return true
                end
                local downed = charData.DataRegistry:Get("Downed")
                if downed == nil then
                    downed = charData.DataRegistry:Get("Down")
                end
                return downed == true
            end
        end
    end
    return false
end

local function fireVoteServer(num)
    local events = ReplicatedStorage:FindFirstChild("Events")
    if events then
        local playerEvent = events:FindFirstChild("Player")
        if playerEvent then
            local vote = playerEvent:FindFirstChild("Vote")
            if vote and vote:IsA("RemoteEvent") then
                vote:FireServer(num)
            end
        end
    end
end

local function ConnectBhop(Humanoid)
    Humanoid.StateChanged:Connect(function(_, NewState)
        if NewState == Enum.HumanoidStateType.Landed then
            if IsHoldingSpace and bhopEnabled then
                Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
            end
        end
    end)
end

local function applyFullBrightness()
    Lighting.Brightness = 2
    Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
    Lighting.Ambient = Color3.fromRGB(255, 255, 255)
    Lighting.GlobalShadows = false
end

local function removeFullBrightness()
    Lighting.Brightness = originalBrightness
    Lighting.OutdoorAmbient = originalOutdoorAmbient
    Lighting.Ambient = originalAmbient
    Lighting.GlobalShadows = originalGlobalShadows
end

local function applySuperFullBrightness()
    Lighting.Brightness = 15
    Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
    Lighting.Ambient = Color3.fromRGB(255, 255, 255)
    Lighting.GlobalShadows = false
end

local function applyNoFog()
    Lighting.FogEnd = 1000000
    Lighting.FogStart = 999999
end

local function removeNoFog()
    Lighting.FogEnd = originalFogEnd
    Lighting.FogStart = originalFogStart
end

local function applyVibrant()
    ColorCorrection.Enabled = true
    ColorCorrection.Saturation = 0.8
    ColorCorrection.Contrast = 0.4
end

local function removeVibrant()
    ColorCorrection.Enabled = originalColorCorrectionEnabled
    ColorCorrection.Saturation = originalSaturation
    ColorCorrection.Contrast = originalContrast
end

-- [[ Player ESP Function ]]
local function CreateEsp(Char, Color, Text, ParentPart, YOffset)
    if not Char or not ParentPart or not ParentPart:IsA("BasePart") then return end
    if Char:FindFirstChild("ESP_Highlight") and ParentPart:FindFirstChild("ESP") then return end

    local targetPart = Char.PrimaryPart or ParentPart
    local initialColor = Color3.fromRGB(0, 255, 100)

    local highlight = Instance.new("Highlight")
    highlight.Name = "ESP_Highlight"
    highlight.Adornee = Char
    highlight.FillColor = initialColor
    highlight.FillTransparency = 0.7
    highlight.OutlineColor = initialColor
    highlight.OutlineTransparency = 0.2
    highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
    highlight.Enabled = true
    highlight.Parent = Char

    local billboard = Instance.new("BillboardGui")
    billboard.Name = "ESP"
    billboard.Size = UDim2.new(4.5, 0, 6.5, 0)
    billboard.AlwaysOnTop = true
    billboard.ClipsDescendants = false
    billboard.StudsOffset = Vector3.new(0, 0, 0)
    billboard.Adornee = targetPart
    billboard.Enabled = true
    billboard.Parent = targetPart

    -- 1. Top Name Label
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Name = "NameLabel"
    nameLabel.Size = UDim2.new(1, 0, 0.15, 0)
    nameLabel.Position = UDim2.new(0.5, 0, 0, 0)
    nameLabel.AnchorPoint = Vector2.new(0.5, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = tostring(Text) or ""
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.TextStrokeTransparency = 0.2
    nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
    nameLabel.Font = Enum.Font.SourceSansBold
    nameLabel.TextScaled = true
    nameLabel.Parent = billboard

    -- 2. Box Frame
    local boxFrame = Instance.new("Frame")
    boxFrame.Name = "BoxFrame"
    boxFrame.Size = UDim2.new(0.75, 0, 0.68, 0)
    boxFrame.Position = UDim2.new(0.5, 0, 0.5, 0)
    boxFrame.AnchorPoint = Vector2.new(0.5, 0.5)
    boxFrame.BackgroundTransparency = 1
    boxFrame.ClipsDescendants = false
    boxFrame.Parent = billboard

    local cornerLines = {}
    local cornerThickness = 2

    local function makeLine(pos, size)
        local line = Instance.new("Frame")
        line.BackgroundColor3 = initialColor
        line.BorderSizePixel = 0
        line.Position = pos
        line.Size = size
        line.Parent = boxFrame
        table.insert(cornerLines, line)
        return line
    end

    makeLine(UDim2.new(0, 0, 0, 0), UDim2.new(0.22, 0, 0, cornerThickness))
    makeLine(UDim2.new(0, 0, 0, 0), UDim2.new(0, cornerThickness, 0.22, 0))
    makeLine(UDim2.new(0.78, 0, 0, 0), UDim2.new(0.22, 0, 0, cornerThickness))
    makeLine(UDim2.new(1, -cornerThickness, 0, 0), UDim2.new(0, cornerThickness, 0.22, 0))
    makeLine(UDim2.new(0, 0, 1, -cornerThickness), UDim2.new(0.22, 0, 0, cornerThickness))
    makeLine(UDim2.new(0, 0, 0.78, 0), UDim2.new(0, cornerThickness, 0.22, 0))
    makeLine(UDim2.new(0.78, 0, 1, -cornerThickness), UDim2.new(0.22, 0, 0, cornerThickness))
    makeLine(UDim2.new(1, -cornerThickness, 0.78, 0), UDim2.new(0, cornerThickness, 0.22, 0))

    local healthBg = Instance.new("Frame")
    healthBg.Name = "HealthBg"
    healthBg.Size = UDim2.new(0, 3, 1, 0)
    healthBg.Position = UDim2.new(0, -7, 0, 0)
    healthBg.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    healthBg.BorderSizePixel = 1
    healthBg.BorderColor3 = Color3.fromRGB(0, 0, 0)
    healthBg.Parent = boxFrame

    local healthFill = Instance.new("Frame")
    healthFill.Name = "HealthFill"
    healthFill.Size = UDim2.new(1, 0, 1, 0)
    healthFill.Position = UDim2.new(0, 0, 0, 0)
    healthFill.BackgroundColor3 = Color3.fromRGB(0, 230, 80)
    healthFill.BorderSizePixel = 0
    healthFill.Parent = healthBg

    local distLabel = Instance.new("TextLabel")
    distLabel.Name = "DistLabel"
    distLabel.Size = UDim2.new(1, 0, 0.15, 0)
    distLabel.Position = UDim2.new(0.5, 0, 1, 0)
    distLabel.AnchorPoint = Vector2.new(0.5, 1)
    distLabel.BackgroundTransparency = 1
    distLabel.Text = "0M"
    distLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    distLabel.TextStrokeTransparency = 0.2
    distLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
    distLabel.Font = Enum.Font.SourceSansBold
    distLabel.TextScaled = true
    distLabel.Parent = billboard

    local tracerLine = nil
    pcall(function()
        if Drawing and Drawing.new then
            tracerLine = Drawing.new("Line")
            tracerLine.Thickness = 1.5
            tracerLine.Transparency = 0.8
            tracerLine.Visible = false
        end
    end)

    task.spawn(function()
        local Camera = Workspace.CurrentCamera
        local humanoid = Char:FindFirstChildOfClass("Humanoid")
        local plr = Players:GetPlayerFromCharacter(Char)
        
        while highlight.Parent and billboard.Parent and targetPart.Parent and Camera do
            local cameraPosition = Camera.CFrame.Position
            local distance = (cameraPosition - targetPart.Position).Magnitude
            distLabel.Text = math.floor(distance + 0.5) .. "M"
            
            local isDowned = false
            if plr then
                isDowned = isPlayerDowned(plr)
            elseif humanoid and humanoid.Health <= 0 then
                isDowned = true
            end

            local activeColor = isDowned and Color3.fromRGB(255, 35, 35) or Color3.fromRGB(0, 255, 100)
            
            for _, line in ipairs(cornerLines) do
                line.BackgroundColor3 = activeColor
            end
            highlight.FillColor = activeColor
            highlight.OutlineColor = activeColor
            
            if ActiveDistanceEsp and tracerLine then
                local screenPos, onScreen = Camera:WorldToViewportPoint(targetPart.Position)
                if onScreen then
                    tracerLine.From = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y)
                    tracerLine.To = Vector2.new(screenPos.X, screenPos.Y)
                    tracerLine.Color = activeColor
                    tracerLine.Visible = true
                else
                    tracerLine.Visible = false
                end
            else
                if tracerLine then tracerLine.Visible = false end
            end

            if humanoid and humanoid.MaxHealth > 0 then
                local hpRatio = math.clamp(humanoid.Health / humanoid.MaxHealth, 0, 1)
                healthFill.Size = UDim2.new(1, 0, hpRatio, 0)
                healthFill.Position = UDim2.new(0, 0, 1 - hpRatio, 0)
            else
                healthFill.Size = UDim2.new(1, 0, 1, 0)
                healthFill.Position = UDim2.new(0, 0, 0, 0)
            end
            
            task.wait(0.05)
        end
        if highlight then highlight:Destroy() end
        if billboard then billboard:Destroy() end
        if tracerLine then
            pcall(function() tracerLine:Remove() end)
        end
    end)
end

local function RemoveEsp(Char, ParentPart)
    if Char then
        local highlight = Char:FindFirstChild("ESP_Highlight")
        if highlight then highlight:Destroy() end
    end
    if ParentPart then
        local targetPart = Char and Char.PrimaryPart or ParentPart
        local billboard = targetPart and targetPart:FindFirstChild("ESP") or ParentPart:FindFirstChild("ESP")
        if billboard then billboard:Destroy() end
    end
end

-- [[ Dedicated NextBot Chams Function ]]
local function CreateBotEsp(bot)
    if not bot then return end
    
    if bot:FindFirstChild("Hitbox") then
        bot.Hitbox.Transparency = 0.5
        bot.Hitbox.Color = Color3.fromRGB(255, 0, 0)
        bot.Hitbox.Material = Enum.Material.Neon
    end

    if not bot:FindFirstChild("Bot_Chams") then
        local chams = Instance.new("Highlight")
        chams.Name = "Bot_Chams"
        chams.Adornee = bot
        chams.FillColor = Color3.fromRGB(255, 0, 0)
        chams.FillTransparency = 0.3
        chams.OutlineColor = Color3.fromRGB(255, 255, 255)
        chams.OutlineTransparency = 0
        chams.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
        chams.Enabled = true
        chams.Parent = bot
    end
end

local function RemoveBotEsp(bot)
    if bot then
        local chams = bot:FindFirstChild("Bot_Chams")
        if chams then chams:Destroy() end
        if bot:FindFirstChild("Hitbox") then
            bot.Hitbox.Transparency = 1
        end
    end
end

local function handlePlayerEsp(player)
    if player ~= localPlayer and player.Character then
        local function createPlayerEspOnCharacter(character)
            if ActiveEspPlayers and character:FindFirstChild("Head") then
                CreateEsp(character, Color3.new(0.4, 0.8, 0.4), player.Name, character.Head, 1)
            end
        end

        createPlayerEspOnCharacter(player.Character)

        player.CharacterAdded:Connect(function(newCharacter)
            task.wait(0.1)
            createPlayerEspOnCharacter(newCharacter)
        end)

        player.CharacterRemoving:Connect(function(oldCharacter)
            if oldCharacter:FindFirstChild("Head") then
                RemoveEsp(oldCharacter, oldCharacter.Head)
            end
        end)
    end
end

-- Movement Input
UserInputService.InputBegan:Connect(function(InputObject, GameProcessedEvent)
    if InputObject.KeyCode == Enum.KeyCode.Space and not GameProcessedEvent then
        IsHoldingSpace = true
    end
end)

UserInputService.InputEnded:Connect(function(InputObject, GameProcessedEvent)
    if InputObject.KeyCode == Enum.KeyCode.Space then
        IsHoldingSpace = false
    end
end)

UserInputService.JumpRequest:Connect(function()
    if InfiniteJump then
        local char = localPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hum then
            hum:ChangeState(Enum.HumanoidStateType.Jumping)
        end
    end
end)

-- Character Added Logic
localPlayer.CharacterAdded:Connect(function(Character)
    local Humanoid = Character:WaitForChild("Humanoid")
    ConnectBhop(Humanoid)
end)

if localPlayer.Character then
    task.spawn(function()
        local Humanoid = localPlayer.Character:WaitForChild("Humanoid")
        ConnectBhop(Humanoid)
    end)
end

local InfoPanel = Tabs.Info:AddPanel("Information")
InfoPanel:AddInfoLabel("Owner:", "Darkmxde.")
InfoPanel:AddInfoLabel("Developer Main:", "0b1100001cat")
InfoPanel:AddInfoLabel("Developer Backup:", "LilYouDev1997x")
InfoPanel:AddInfoLabel("Discord:", "https://discord.gg/osxhub")

InfoPanel:AddWideButton({
    Title = "Discord Server",
    Callback = function() pcall(function() setclipboard("https://discord.gg/osxhub") end) end
})

-- [[ Player Tab ]]
local PlayerPanel = Tabs.Main:AddPanel("Movement Control")

PlayerPanel:AddToggle({
    Title = "CFrame Speed Boost",
    Description = "เพิ่มความเร็วโดยใช้ CFrame (แรงกว่าปกติ)",
    Default = false,
    Callback = function(Value)
        ActiveCFrameSpeedBoost = Value
        if ActiveCFrameSpeedBoost then
            if cframeSpeedConnection then cframeSpeedConnection:Disconnect() end
            cframeSpeedConnection = RunService.RenderStepped:Connect(function()
                local char = localPlayer.Character
                local hrp = char and char:FindFirstChild("HumanoidRootPart")
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                if hrp and hum and hum.MoveDirection.Magnitude > 0 then
                    hrp.CFrame = hrp.CFrame + hum.MoveDirection * (ValueSpeed * 0.08)
                end
            end)
        else
            if cframeSpeedConnection then
                cframeSpeedConnection:Disconnect()
                cframeSpeedConnection = nil
            end
        end
    end
})

PlayerPanel:AddSlider({
    Title = "Speed Value",
    Description = "ปรับความเร็ว CFrame (ต้องเปิด CFrame ก่อน)",
    Default = 1,
    Min = 1,
    Max = 150,
    Callback = function(Value)
        ValueSpeed = Value
    end
})

PlayerPanel:AddToggle({
    Title = "Infinite Jump",
    Description = "กระโดดได้ไม่จำกัดครั้ง (กระโดดกลางอากาศได้)",
    Default = false,
    Callback = function(Value)
        InfiniteJump = Value
    end
})

PlayerPanel:AddToggle({
    Title = "No Clip",
    Description = "เดินทะลุสิ่งกีดขวางและกำแพงได้",
    Default = false,
    Callback = function(Value)
        Noclip = Value
    end
})

PlayerPanel:AddToggle({
    Title = "Auto Bhop",
    Description = "กด Space ค้างไว้เพื่อกระโดดรัวๆ (Bunny Hop)",
    Default = false,
    Callback = function(Value)
        bhopEnabled = Value
    end
})

-- [[ Visuals Tab ]]
local EspPanel = Tabs.Visuals:AddPanel("ESP Features")

local function isNextBot(charModel)
    if not charModel or not charModel:IsA("Model") then return false end
    if charModel:GetAttribute("AI") == true then return true end
    if charModel:GetAttribute("Team") == "Nextbot" then return true end
    if charModel:FindFirstChild("Hitbox") ~= nil then return true end
    return false
end

EspPanel:AddToggle({
    Title = "Players ESP",
    Description = "แสดงตำแหน่งและชื่อผู้เล่นคนอื่น",
    Default = false,
    Callback = function(Value)
        ActiveEspPlayers = Value
        if ActiveEspPlayers then
            if not playerAddedConnection then
                playerAddedConnection = RunService.Heartbeat:Connect(function()
                    local playersFolder = Workspace:FindFirstChild("Players")
                    if playersFolder then
                        local myChar = localPlayer.Character
                        for _, charModel in pairs(playersFolder:GetChildren()) do
                            if charModel:IsA("Model") and charModel ~= myChar then
                                -- คัดกรองจาก Attribute AI และ Team Nextbot
                                if not isNextBot(charModel) then
                                    local head = charModel:FindFirstChild("Head") or charModel.PrimaryPart
                                    if head then
                                        CreateEsp(charModel, Color3.new(0.4, 0.8, 0.4), charModel.Name, head, 1)
                                    end
                                end
                            end
                        end
                    end
                end)
            end
        else
            if playerAddedConnection then
                playerAddedConnection:Disconnect()
                playerAddedConnection = nil
            end
            
            local playersFolder = Workspace:FindFirstChild("Players")
            if playersFolder then
                for _, charModel in pairs(playersFolder:GetChildren()) do
                    if charModel:IsA("Model") then
                        local head = charModel:FindFirstChild("Head") or charModel.PrimaryPart
                        RemoveEsp(charModel, head)
                    end
                end
            end
        end
    end
})

-- EspPanel:AddToggle({
--     Title = "NextBots Chams",
--     Description = "แสดงร่างบอททะลุกำแพงแบบ Chams (เช็คจาก Attribute AI/Nextbot)",
--     Default = false,
--     Callback = function(Value)
--         ActiveEspBots = Value
--         if ActiveEspBots then
--             botLoopConnection = RunService.Heartbeat:Connect(function()
--                 local playersFolder = Workspace:FindFirstChild("Players")
--                 if playersFolder then
--                     for _, charModel in pairs(playersFolder:GetChildren()) do
--                         if isNextBot(charModel) then
--                             CreateBotEsp(charModel)
--                         end
--                     end
--                 end
--                 local gameFolder = Workspace:FindFirstChild("Game")
--                 local botsFolder = gameFolder and gameFolder:FindFirstChild("Players")
--                 if botsFolder then
--                     for _, bot in pairs(botsFolder:GetChildren()) do
--                         if isNextBot(bot) then
--                             CreateBotEsp(bot)
--                         end
--                     end
--                 end
--             end)
--         else
--             if botLoopConnection then
--                 botLoopConnection:Disconnect()
--                 botLoopConnection = nil
--             end
--             local playersFolder = Workspace:FindFirstChild("Players")
--             if playersFolder then
--                 for _, charModel in pairs(playersFolder:GetChildren()) do
--                     if isNextBot(charModel) then
--                         RemoveBotEsp(charModel)
--                     end
--                 end
--             end
--             local gameFolder = Workspace:FindFirstChild("Game")
--             local botsFolder = gameFolder and gameFolder:FindFirstChild("Players")
--             if botsFolder then
--                 for _, bot in pairs(botsFolder:GetChildren()) do
--                     if isNextBot(bot) then
--                         RemoveBotEsp(bot)
--                     end
--                 end
--             end
--         end
--     end
-- })

EspPanel:AddToggle({
    Title = "Tracers ESP (Lines)",
    Description = "แสดงเส้นนำสายตาชี้ไปยังเป้าหมาย",
    Default = false,
    Callback = function(Value)
        ActiveDistanceEsp = Value
    end
})

local LightPanel = Tabs.Visuals:AddPanel("Lighting & Visibility")

LightPanel:AddToggle({
    Title = "Full Brightness",
    Description = "เปิดความสว่างสูงสุดเพื่อให้มองเห็นในที่มืด",
    Default = false,
    Callback = function(Value)
        if Value then applyFullBrightness() else removeFullBrightness() end
    end
})

LightPanel:AddToggle({
    Title = "Super Full Brightness",
    Description = "เปิดความสว่างระดับพิเศษ (สว่างมากเป็นพิเศษ)",
    Default = false,
    Callback = function(Value)
        if Value then applySuperFullBrightness() else removeFullBrightness() end
    end
})

-- LightPanel:AddToggle({
--     Title = "No Fog",
--     Description = "ลบหมอกในแมพออกเพื่อให้มองเห็นได้ไกลขึ้น",
--     Default = false,
--     Callback = function(Value)
--         if Value then applyNoFog() else removeNoFog() end
--     end
-- })

LightPanel:AddToggle({
    Title = "Vibrant Colors",
    Description = "ปรับสีสันของเกมให้ดูสดใสและเข้มขึ้น",
    Default = false,
    Callback = function(Value)
        if Value then applyVibrant() else removeVibrant() end
    end
})

-- [[ Auto Tab ]]
local VotePanel = Tabs.Auto:AddPanel("Map Voting Control")

VotePanel:AddDropdown({
    Title = "Select Map",
    Description = "เลือกแผนที่ที่คุณต้องการจะโหวต",
    Values = {"Map 1", "Map 2", "Map 3", "Map 4"},
    Default = "Map 1",
    Callback = function(Option)
        if Option == "Map 1" then selectedMapNumber = 1
        elseif Option == "Map 2" then selectedMapNumber = 2
        elseif Option == "Map 3" then selectedMapNumber = 3
        elseif Option == "Map 4" then selectedMapNumber = 4
        end
    end
})

VotePanel:AddButton({
    Title = "Vote Map Now",
    Description = "กดเพื่อส่งคะแนนโหวตแผนที่ที่เลือกไว้",
    Callback = function()
        fireVoteServer(selectedMapNumber)
    end
})

VotePanel:AddToggle({
    Title = "Auto Vote Loop",
    Description = "ระบบจะทำการโหวตแผนที่ที่เลือกให้อัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoVoteEnabled = Value
        if autoVoteEnabled then
            if not voteConnection then
                voteConnection = RunService.Heartbeat:Connect(function()
                    fireVoteServer(selectedMapNumber)
                end)
            end
        else
            if voteConnection then
                voteConnection:Disconnect()
                voteConnection = nil
            end
        end
    end
})

local RevivePanel = Tabs.Auto:AddPanel("Revive & Survival")

RevivePanel:AddButton({
    Title = "Revive Yourself",
    Description = "กดเพื่อชุบชีวิตตัวเองเมื่อถูกน็อค (Downed)",
    Callback = function()
        if isPlayerDowned(localPlayer) then
            pcall(function()
                ReplicatedStorage.Events.SetPlayerMode:FireServer(true)
            end)
        end
    end
})

RevivePanel:AddToggle({
    Title = "Auto Revive Loop",
    Description = "ชุบชีวิตตัวเองให้อัตโนมัติทันทีเมื่อถูกน็อค",
    Default = false,
    Callback = function(Value)
        autoReviveEnabled = Value
    end
})

-- RevivePanel:AddToggle({
--     Title = "Auto Revive Teammates (Auto E)",
--     Description = "ออโต้กด E ชุบชีวิตเพื่อนร่วมทีมให้อัตโนมัติทันทีเมื่อเข้าใกล้ในระยะ 8 สตัด",
--     Default = false,
--     Callback = function(Value)
--         FastReviveEnabled = Value
        
--         local InteractionService
--         pcall(function()
--             InteractionService = require(ReplicatedStorage.Services.Asset.InteractionService)
--         end)

--         if Value then
--             -- ลูป Auto E ล็อกเป้าหมายชุบชีวิต
--             task.spawn(function()
--                 local processed = {}
--                 while FastReviveEnabled do
--                     for _, plr in pairs(game.Players:GetPlayers()) do
--                         if plr ~= localPlayer then
--                             local targetTag = plr.Character and plr.Character:GetAttribute("Tag")
--                             if targetTag then
--                                 if isPlayerDowned(plr) then
--                                     local root = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
--                                     local targetRoot = plr.Character:FindFirstChild("HumanoidRootPart")
                                    
--                                     if root and targetRoot then
--                                         local distance = (root.Position - targetRoot.Position).Magnitude
--                                         if distance <= 8 then
--                                             -- กด E อัตโนมัติแค่ครั้งเดียว และล็อกไว้จนกว่าเพื่อนจะฟื้น
--                                             if not processed[targetTag] then
--                                                 processed[targetTag] = tick()
--                                                 print("[DEBUG] Auto E Triggered on: " .. plr.Name .. " (Tag: " .. tostring(targetTag) .. ")")
--                                                 if InteractionService and InteractionService.KeyUsed then
--                                                     pcall(function()
--                                                         InteractionService:KeyUsed({ Keybind = "Interact", Down = true })
--                                                     end)
--                                                 end
--                                             end
--                                         end
--                                     end
--                                 else
--                                     -- ปลดล็อกเมื่อเพื่อนฟื้นขึ้นมาแล้ว
--                                     processed[targetTag] = nil
--                                 end
--                             end
--                         end
--                     end
--                     task.wait(0.2)
--                 end
--             end)
--         end
--     end
-- })

-- RevivePanel:AddToggle({
--     Title = "Auto Carry Mode",
--     Description = "อุ้มเพื่อนที่ล้มโดยอัตโนมัติเมื่อเข้าใกล้",
--     Default = false,
--     Callback = function(Value)
--         autoCarryEnabled = Value
--         if Value then
--             task.spawn(function()
--                 while autoCarryEnabled do
--                     for _, plr in pairs(game.Players:GetPlayers()) do
--                         if not autoCarryEnabled then break end
--                         if isPlayerDowned(plr) then
--                             local char = localPlayer.Character
--                             local hrp = char and char:FindFirstChild("HumanoidRootPart")
--                             local targetHrp = plr.Character:FindFirstChild("HumanoidRootPart")
--                             local targetTag = plr.Character:GetAttribute("Tag")
                            
--                             local gameGui = localPlayer.PlayerGui:FindFirstChild("Game")
--                             local respawnGui = gameGui and gameGui:FindFirstChild("Respawn")
--                             local downedGui = respawnGui and respawnGui:FindFirstChild("Downed")
--                             local selfDowned = respawnGui and respawnGui.Visible and downedGui and downedGui.Visible
                            
--                             if hrp and targetHrp and targetTag and not selfDowned then
--                                 local distance = (hrp.Position - targetHrp.Position).Magnitude
--                                 if distance < 15 then
--                                     ReplicatedStorage.Events.Interact:FireServer("Carry", targetTag)
--                                     task.wait(1)
--                                 end
--                             end
--                         end
--                     end
--                     task.wait(0.5)
--                 end
--             end)
--         end
--     end
-- })

-- [[ Farm Tab ]]
local FarmPanel = Tabs.Farm:AddPanel("Auto Farming Systems")

FarmPanel:AddToggle({
    Title = "Invisibility (Anti-Spectate)",
    Description = "ทำให้ตัวละครล่องหนเพื่อป้องกันการถูกคนอื่น Spectate",
    Default = false,
    Callback = function(Value)
        invisibilityEnabled = Value
        local function updateTransparency()
            local char = localPlayer.Character
            if char then
                for _, v in pairs(char:GetDescendants()) do
                    if v:IsA("BasePart") and v.Name ~= "HumanoidRootPart" then
                        v.Transparency = invisibilityEnabled and 1 or 0
                    elseif v:IsA("Decal") then
                        v.Transparency = invisibilityEnabled and 1 or 0
                    elseif v:IsA("BillboardGui") then
                        v.Enabled = not invisibilityEnabled
                    end
                end
            end
        end
        
        if invisibilityEnabled then
            task.spawn(function()
                while invisibilityEnabled do
                    updateTransparency()
                    task.wait(1)
                end
            end)
        else
            updateTransparency()
        end
    end
})

-- FarmPanel:AddToggle({
--     Title = "AUTO FARM EXP + MONEY",
--     Description = "ฟามเงินเเละค่าประสบการณ์อัตโนมัติ (จะวาร์ปไปจุดปลอดภัยเมื่อว่าง)",
--     Default = false,
--     Callback = function(Value)
--         teleportToReviveEnabled = Value
--         if Value then
--             local char = localPlayer.Character
--             local hrp = char and char:FindFirstChild("HumanoidRootPart")
--             if hrp then lastPosBeforeFloat = hrp.CFrame end
            
--             task.spawn(function()
--                 while teleportToReviveEnabled do
--                     local foundDowned = false
--                     local char = localPlayer.Character
--                     local hrp = char and char:FindFirstChild("HumanoidRootPart")
                    
--                     local gameGui = localPlayer.PlayerGui:FindFirstChild("Game")
--                     local respawnGui = gameGui and gameGui:FindFirstChild("Respawn")
--                     local downedGui = respawnGui and respawnGui:FindFirstChild("Downed")
--                     local selfDowned = respawnGui and respawnGui.Visible and downedGui and downedGui.Visible
                    
--                     if hrp and not selfDowned then
--                         for _, plr in pairs(game.Players:GetPlayers()) do
--                             if isPlayerDowned(plr) then
--                                 local targetHrp = plr.Character:FindFirstChild("HumanoidRootPart")
--                                 local targetTag = plr.Character:GetAttribute("Tag")
--                                 if targetHrp and targetTag then
--                                     foundDowned = true
--                                     hrp.CFrame = targetHrp.CFrame * CFrame.new(0, 3, 0)
--                                     task.wait(0.1)
--                                     ReplicatedStorage.Events.Interact:FireServer("Revive", targetTag, true)
--                                     task.wait(1.0)
--                                     ReplicatedStorage.Events.Interact:FireServer("Revive", targetTag)
--                                     task.wait(0.5)
--                                     break
--                                 end
--                             end
--                         end
                        
--                         if not foundDowned then
--                             managePlatform(true)
--                             hrp.CFrame = CFrame.new(getSafePos())
--                         end
--                     end
--                     task.wait(0.5)
--                 end
                
--                 if not autoExpFloatEnabled then
--                     managePlatform(false)
--                     if lastPosBeforeFloat and hrp then hrp.CFrame = lastPosBeforeFloat end
--                 end
--             end)
--         end
--     end
-- })

FarmPanel:AddToggle({
    Title = "AUTO FARM EXP (Sky)",
    Description = "วาร์ปไปลอยตัวบนฟ้าสูงๆ เพื่อหนี NextBot และรับ EXP",
    Default = false,
    Callback = function(Value)
        autoExpFloatEnabled = Value
        local char = localPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        
        if Value then
            if hrp then
                if not lastPosBeforeFloat then lastPosBeforeFloat = hrp.CFrame end
                managePlatform(true)
                hrp.CFrame = CFrame.new(getSafePos())
            end
        else
            if not teleportToReviveEnabled then
                managePlatform(false)
                if lastPosBeforeFloat and hrp then hrp.CFrame = lastPosBeforeFloat end
            end
        end
    end
})

FarmPanel:AddToggle({
    Title = "Auto Collect Token",
    Description = "วาปไปเก็บ Token กิจกรรมอัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoCollectTokenEnabled = Value
        if Value then
            local char = localPlayer.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart")
            if hrp and not lastPosBeforeFloat then lastPosBeforeFloat = hrp.CFrame end
            
            task.spawn(function()
                while autoCollectTokenEnabled do
                    local char = localPlayer.Character
                    local hrp = char and char:FindFirstChild("HumanoidRootPart")
                    
                    if hrp and not char:GetAttribute("Downed") then
                        local tickets = workspace:FindFirstChild("Effects") and workspace.Effects:FindFirstChild("Tickets")
                        local foundTokens = {}
                        
                        if tickets then
                            for _, v in pairs(tickets:GetChildren()) do
                                if v.Name == "Visual" then
                                    table.insert(foundTokens, v)
                                end
                            end
                        end
                        
                        if #foundTokens > 0 then
                            managePlatform(false)
                            for _, token in ipairs(foundTokens) do
                                if not autoCollectTokenEnabled then break end
                                local targetCFrame = token:IsA("BasePart") and token.CFrame or (token:FindFirstChildWhichIsA("BasePart") and token:FindFirstChildWhichIsA("BasePart").CFrame)
                                if targetCFrame then
                                    hrp.CFrame = targetCFrame
                                    task.wait(0.3)
                                end
                            end
                            -- Wait a bit to ensure the last token is collected
                            task.wait(0.5)
                            -- Return to safe position after finishing collection
                            managePlatform(true)
                            hrp.CFrame = CFrame.new(getSafePos())
                        else
                            -- Just ensure platform is managed, protection loop will handle positioning if necessary
                            managePlatform(true)
                        end
                    end
                    task.wait(1)
                end
                
                if not teleportToReviveEnabled and not autoExpFloatEnabled then
                    managePlatform(false)
                    local hrp = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
                    if lastPosBeforeFloat and hrp then hrp.CFrame = lastPosBeforeFloat end
                end
            end)
        end
    end
})

-- [[ Misc Tab ]]
local MiscPanel = Tabs.Misc:AddPanel("Utility & Optimization")

MiscPanel:AddToggle({
    Title = "Anti-AFK System",
    Description = "ป้องกันการถูกเตะออกจากเซิร์ฟเวอร์",
    Default = true,
    Callback = function(Value)
        afk = Value
        if Value then
            task.spawn(function()
                while afk do
                    VirtualUser:Button2Down(Vector2.new(0,0), Workspace.CurrentCamera.CFrame)
                    VirtualUser:Button2Up(Vector2.new(0,0), Workspace.CurrentCamera.CFrame)
                    task.wait(60)
                end
            end)
        end
    end
})

-- MiscPanel:AddButton({
--     Title = "FPS Boost",
--     Description = "ลดคุณภาพกราฟิกเพื่อให้ลื่นขึ้น",
--     Callback = function()
--         for _, v in pairs(game:GetDescendants()) do
--             if v:IsA("BasePart") then
--                 v.Material = Enum.Material.SmoothPlastic
--                 v.Reflectance = 0
--             elseif v:IsA("Decal") then
--                 v.Transparency = 1
--             end
--         end
--         settings().Rendering.QualityLevel = Enum.QualityLevel.Level01
--     end
-- })

-- -- [[ Settings Tab ]]
-- local InfoPanel = Tabs.Settings:AddPanel("Developer Panel")

-- InfoPanel:AddInfoLabel("User", localPlayer.Name, "The current player using the script.")
-- InfoPanel:AddInfoLabel("Script", GameName .. " - Hub Version", "Active script profile.")
-- InfoPanel:AddInfoLabel("Discord", "discord.gg/osxhub", "Official Discord support.")

-- [[ System Logic ]]
RunService.Stepped:Connect(function()
    if Noclip then
        local char = localPlayer.Character
        if char then
            for _, v in pairs(char:GetDescendants()) do
                if v:IsA("BasePart") then
                    v.CanCollide = false
                end
            end
        end
    end
end)

RunService.Heartbeat:Connect(function()
    if autoReviveEnabled then
        if tick() - lastCheckTime >= checkInterval then
            lastCheckTime = tick()
            if isPlayerDowned(localPlayer) then
                pcall(function()
                    ReplicatedStorage.Events.SetPlayerMode:FireServer(true)
                end)
            end
        end
    end
end)

-- [[ PROTECTION LOOP ]]
task.spawn(function()
    while true do
        local char = localPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        
        local gameGui = localPlayer.PlayerGui:FindFirstChild("Game")
        local respawnGui = gameGui and gameGui:FindFirstChild("Respawn")
        local downedGui = respawnGui and respawnGui:FindFirstChild("Downed")
        local selfDowned = respawnGui and respawnGui.Visible and downedGui and downedGui.Visible
        
        if hrp and not selfDowned then
            local needsSafePos = false
            
            if autoExpFloatEnabled then
                needsSafePos = true
            elseif autoCollectTokenEnabled and not (workspace:FindFirstChild("Effects") and workspace.Effects:FindFirstChild("Tickets")) then
                needsSafePos = true
            elseif teleportToReviveEnabled then
                local foundDowned = false
                for _, plr in pairs(game.Players:GetPlayers()) do
                    if isPlayerDowned(plr) then
                        foundDowned = true
                        break
                    end
                end
                if not foundDowned then
                    needsSafePos = true
                end
            end
            
            if needsSafePos then
                managePlatform(true)
                local safePos = getSafePos()
                if (hrp.Position - safePos).Magnitude > 50 then
                    hrp.CFrame = CFrame.new(safePos)
                end
            end
        end
        task.wait(1)
    end
end)

